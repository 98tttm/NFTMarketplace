// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFTCollection
/// @notice ERC-721 collection with minting fees, batch mint, and ERC-2981 royalties
contract NFTCollection is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {

    uint256 private _nextTokenId;
    uint256 public mintFee;
    uint256 public maxBatchSize = 10;

    mapping(address => uint256[]) private _ownedTokens;

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialMintFee,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        mintFee = initialMintFee;
    }

    /// @notice Mint a single NFT with royalty
    /// @param to Recipient address
    /// @param uri IPFS metadata URI
    /// @param royaltyFraction Royalty in basis points (e.g. 500 = 5%)
    function mint(
        address to,
        string memory uri,
        uint96 royaltyFraction
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(royaltyFraction <= 1000, "Royalty max 10%");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _setTokenRoyalty(tokenId, msg.sender, royaltyFraction);

        _ownedTokens[to].push(tokenId);

        emit NFTMinted(tokenId, msg.sender, uri);
        return tokenId;
    }

    /// @notice Batch mint up to `maxBatchSize` NFTs in one transaction
    /// @param to Recipient address
    /// @param uris Array of IPFS metadata URIs
    /// @param royaltyFraction Royalty applied to all minted tokens
    function batchMint(
        address to,
        string[] memory uris,
        uint96 royaltyFraction
    ) external payable nonReentrant returns (uint256[] memory) {
        uint256 count = uris.length;
        require(count > 0 && count <= maxBatchSize, "Invalid batch size");
        require(msg.value >= mintFee * count, "Insufficient mint fee");
        require(royaltyFraction <= 1000, "Royalty max 10%");

        uint256[] memory tokenIds = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uris[i]);
            _setTokenRoyalty(tokenId, msg.sender, royaltyFraction);
            _ownedTokens[to].push(tokenId);
            tokenIds[i] = tokenId;

            emit NFTMinted(tokenId, msg.sender, uris[i]);
        }

        return tokenIds;
    }

    /// @notice Update the minting fee (owner only)
    function setMintFee(uint256 fee) external onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = fee;
        emit MintFeeUpdated(oldFee, fee);
    }

    /// @notice Withdraw accumulated fees to owner
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /// @notice Get all token IDs owned by an address
    function tokensByOwner(address ownerAddr) external view returns (uint256[] memory) {
        return _ownedTokens[ownerAddr];
    }

    /// @notice Total number of tokens minted
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // ──────── Override resolution ────────

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        address result = super._update(to, tokenId, auth);

        // Track ownership changes for the _ownedTokens mapping
        if (from != address(0) && from != to) {
            _removeTokenFromOwner(from, tokenId);
        }
        if (to != address(0) && from != to && from != address(0)) {
            _ownedTokens[to].push(tokenId);
        }

        return result;
    }

    function _removeTokenFromOwner(address ownerAddr, uint256 tokenId) private {
        uint256[] storage tokens = _ownedTokens[ownerAddr];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
