// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFTAuction
/// @notice English auction with anti-sniping, automatic refunds, and ERC-2981 royalties
contract NFTAuction is ReentrancyGuard, Ownable {

    struct Auction {
        uint256 auctionId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 startingPrice;
        uint256 highestBid;
        address payable highestBidder;
        uint256 endTime;
        bool ended;
        bool cancelled;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    uint256 private _nextAuctionId;

    uint256 public constant MIN_DURATION = 1 minutes;
    uint256 public constant MAX_DURATION = 30 days;
    /// @dev Minimum bid increment over current highest bid (5%)
    uint256 public constant MIN_BID_INCREMENT_BPS = 500;
    /// @dev Anti-sniping window and extension
    uint256 public constant ANTI_SNIPE_WINDOW = 5 minutes;
    uint256 public constant ANTI_SNIPE_EXTENSION = 5 minutes;

    uint96 public platformFee = 250; // 2.5%
    uint96 public constant MAX_PLATFORM_FEE = 1000;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) private _auctionBids;

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 startingPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 newEndTime
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address winner,
        uint256 amount,
        uint256 platformFeeAmount,
        uint256 royaltyAmount
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event PlatformFeeUpdated(uint96 oldFee, uint96 newFee);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ──────── Core Functions ────────

    /// @notice Create an English auction for an NFT
    /// @param nftContract ERC-721 contract address
    /// @param tokenId Token to auction
    /// @param startingPrice Minimum starting bid in wei
    /// @param durationSeconds Auction duration (1 hour – 30 days)
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 durationSeconds
    ) external nonReentrant returns (uint256) {
        require(startingPrice > 0, "Starting price must be > 0");
        require(durationSeconds >= MIN_DURATION, "Duration too short");
        require(durationSeconds <= MAX_DURATION, "Duration too long");
        require(
            IERC721(nftContract).supportsInterface(type(IERC721).interfaceId),
            "Not a valid ERC-721"
        );
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            IERC721(nftContract).getApproved(tokenId) == address(this) ||
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
            "Auction not approved"
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        uint256 auctionId = _nextAuctionId++;
        uint256 endTime = block.timestamp + durationSeconds;

        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: payable(address(0)),
            endTime: endTime,
            ended: false,
            cancelled: false
        });

        emit AuctionCreated(auctionId, nftContract, tokenId, msg.sender, startingPrice, endTime);
        return auctionId;
    }

    /// @notice Place a bid on an active auction
    /// @dev Bid must exceed current highest by at least 5%. Previous bidder is refunded.
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.cancelled, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction has expired");
        require(msg.sender != auction.seller, "Seller cannot bid");

        if (auction.highestBid == 0) {
            require(msg.value >= auction.startingPrice, "Bid below starting price");
        } else {
            uint256 minBid = auction.highestBid + (auction.highestBid * MIN_BID_INCREMENT_BPS) / 10000;
            require(msg.value >= minBid, "Bid below minimum increment");
        }

        // Refund previous highest bidder
        address payable previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        auction.highestBid = msg.value;
        auction.highestBidder = payable(msg.sender);

        // Anti-sniping: extend if bid in last 5 minutes
        if (auction.endTime - block.timestamp < ANTI_SNIPE_WINDOW) {
            auction.endTime += ANTI_SNIPE_EXTENSION;
        }

        _auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Refund previous bidder after state updates (CEI pattern)
        if (previousBidder != address(0) && previousBid > 0) {
            (bool refundOk, ) = previousBidder.call{value: previousBid}("");
            require(refundOk, "Refund to previous bidder failed");
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, auction.endTime);
    }

    /// @notice End an auction after it expires. Callable by anyone.
    /// @dev Transfers NFT to winner, distributes funds (platform fee + royalty + seller)
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended && !auction.cancelled, "Auction already finalized");
        require(block.timestamp >= auction.endTime, "Auction not yet expired");

        auction.ended = true;

        if (auction.highestBidder == address(0)) {
            // No bids — return NFT to seller
            IERC721(auction.nftContract).transferFrom(
                address(this), auction.seller, auction.tokenId
            );
            emit AuctionEnded(auctionId, address(0), 0, 0, 0);
            return;
        }

        uint256 totalAmount = auction.highestBid;
        uint256 feeAmount = (totalAmount * platformFee) / 10000;
        uint256 royaltyAmount = 0;
        address royaltyReceiver;

        if (IERC721(auction.nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (royaltyReceiver, royaltyAmount) = IERC2981(auction.nftContract)
                .royaltyInfo(auction.tokenId, totalAmount);
            if (royaltyReceiver == auction.seller) {
                royaltyAmount = 0;
            }
        }

        uint256 sellerProceeds = totalAmount - feeAmount - royaltyAmount;

        // Transfer NFT to winner
        IERC721(auction.nftContract).transferFrom(
            address(this), auction.highestBidder, auction.tokenId
        );

        // Distribute funds
        if (feeAmount > 0) {
            (bool feeOk, ) = payable(owner()).call{value: feeAmount}("");
            require(feeOk, "Fee transfer failed");
        }
        if (royaltyAmount > 0 && royaltyReceiver != address(0)) {
            (bool royaltyOk, ) = payable(royaltyReceiver).call{value: royaltyAmount}("");
            require(royaltyOk, "Royalty transfer failed");
        }
        (bool sellerOk, ) = auction.seller.call{value: sellerProceeds}("");
        require(sellerOk, "Seller transfer failed");

        emit AuctionEnded(auctionId, auction.highestBidder, totalAmount, feeAmount, royaltyAmount);
    }

    /// @notice Cancel an auction before any bids have been placed
    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.seller == msg.sender, "Not the seller");
        require(!auction.ended && !auction.cancelled, "Auction already finalized");
        require(auction.highestBidder == address(0), "Cannot cancel after bids");

        auction.cancelled = true;

        IERC721(auction.nftContract).transferFrom(
            address(this), msg.sender, auction.tokenId
        );

        emit AuctionCancelled(auctionId);
    }

    // ──────── View Functions ────────

    /// @notice Get all bids for a given auction
    function getAuctionBids(uint256 auctionId) external view returns (Bid[] memory) {
        return _auctionBids[auctionId];
    }

    /// @notice Get all active (non-ended, non-cancelled) auctions
    function fetchActiveAuctions() external view returns (Auction[] memory) {
        uint256 total = _nextAuctionId;
        uint256 activeCount = 0;

        for (uint256 i = 0; i < total; i++) {
            if (!auctions[i].ended && !auctions[i].cancelled) activeCount++;
        }

        Auction[] memory items = new Auction[](activeCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < total; i++) {
            if (!auctions[i].ended && !auctions[i].cancelled) {
                items[idx++] = auctions[i];
            }
        }
        return items;
    }

    // ──────── Admin ────────

    function setPlatformFee(uint96 fee) external onlyOwner {
        require(fee <= MAX_PLATFORM_FEE, "Fee exceeds maximum");
        uint96 oldFee = platformFee;
        platformFee = fee;
        emit PlatformFeeUpdated(oldFee, fee);
    }
}
