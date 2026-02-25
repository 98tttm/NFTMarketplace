// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFTMarketplace
/// @notice Fixed-price marketplace with platform fees and ERC-2981 royalty distribution
contract NFTMarketplace is ReentrancyGuard, Ownable, Pausable {

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 price;
        bool active;
        uint256 listedAt;
    }

    uint256 private _nextListingId;
    /// @dev Platform fee in basis points (250 = 2.5%)
    uint96 public platformFee = 250;
    uint96 public constant MAX_PLATFORM_FEE = 1000; // 10%

    mapping(uint256 => Listing) public listings;
    /// @dev (nftContract, tokenId) => listingId for duplicate-listing prevention
    mapping(address => mapping(uint256 => uint256)) private _activeListingByToken;

    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price,
        uint256 platformFeeAmount,
        uint256 royaltyAmount
    );
    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);
    event PlatformFeeUpdated(uint96 oldFee, uint96 newFee);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ──────── Modifiers ────────

    modifier onlySeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        _;
    }

    modifier activeListing(uint256 listingId) {
        require(listings[listingId].active, "Listing not active");
        _;
    }

    // ──────── Core Functions ────────

    /// @notice List an NFT for sale at a fixed price
    /// @dev Caller must have approved this contract for the token
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(price > 0, "Price must be > 0");
        require(
            IERC721(nftContract).supportsInterface(type(IERC721).interfaceId),
            "Not a valid ERC-721"
        );
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Marketplace not approved"
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            active: true,
            listedAt: block.timestamp
        });

        _activeListingByToken[nftContract][tokenId] = listingId;

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, price);
        return listingId;
    }

    /// @notice Buy a listed NFT; pays platform fee and creator royalty automatically
    function buyNFT(uint256 listingId)
        external payable whenNotPaused nonReentrant activeListing(listingId)
    {
        Listing storage listing = listings[listingId];
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Seller cannot buy own NFT");

        listing.active = false;
        delete _activeListingByToken[listing.nftContract][listing.tokenId];

        uint256 price = listing.price;
        uint256 feeAmount = (price * platformFee) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver;

        // Query ERC-2981 royalty
        if (IERC721(listing.nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = IERC2981(listing.nftContract)
                .royaltyInfo(listing.tokenId, price);
            if (royaltyReceiver == listing.seller) {
                royaltyAmount = 0; // No self-royalty on primary sale
            }
        }

        uint256 sellerProceeds = price - feeAmount - royaltyAmount;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        // Distribute funds
        if (feeAmount > 0) {
            (bool feeOk, ) = payable(owner()).call{value: feeAmount}("");
            require(feeOk, "Fee transfer failed");
        }
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltyOk, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyOk, "Royalty transfer failed");
        }
        (bool sellerOk, ) = listing.seller.call{value: sellerProceeds}("");
        require(sellerOk, "Seller transfer failed");

        // Refund overpayment
        if (msg.value > price) {
            (bool refundOk, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refundOk, "Refund failed");
        }

        emit NFTSold(listingId, msg.sender, price, feeAmount, royaltyAmount);
    }

    /// @notice Cancel an active listing; returns NFT to seller
    function cancelListing(uint256 listingId)
        external nonReentrant activeListing(listingId) onlySeller(listingId)
    {
        Listing storage listing = listings[listingId];
        listing.active = false;
        delete _activeListingByToken[listing.nftContract][listing.tokenId];

        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);

        emit ListingCancelled(listingId);
    }

    /// @notice Update listing price (seller only)
    function updatePrice(uint256 listingId, uint256 newPrice)
        external activeListing(listingId) onlySeller(listingId)
    {
        require(newPrice > 0, "Price must be > 0");
        uint256 oldPrice = listings[listingId].price;
        listings[listingId].price = newPrice;
        emit PriceUpdated(listingId, oldPrice, newPrice);
    }

    // ──────── View Functions ────────

    /// @notice Returns all active listings
    function fetchMarketItems() external view returns (Listing[] memory) {
        uint256 total = _nextListingId;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active) activeCount++;
        }

        Listing[] memory items = new Listing[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active) {
                items[idx++] = listings[i];
            }
        }
        return items;
    }

    /// @notice Returns active listings by a specific seller
    function fetchListingsByOwner(address ownerAddr) external view returns (Listing[] memory) {
        uint256 total = _nextListingId;
        uint256 count = 0;

        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active && listings[i].seller == ownerAddr) count++;
        }

        Listing[] memory items = new Listing[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            if (listings[i].active && listings[i].seller == ownerAddr) {
                items[idx++] = listings[i];
            }
        }
        return items;
    }

    // ──────── Admin Functions ────────

    /// @notice Set platform fee (max 10%)
    function setPlatformFee(uint96 fee) external onlyOwner {
        require(fee <= MAX_PLATFORM_FEE, "Fee exceeds maximum");
        uint96 oldFee = platformFee;
        platformFee = fee;
        emit PlatformFeeUpdated(oldFee, fee);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
