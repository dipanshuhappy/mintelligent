//SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import "../NFT.sol";
contract MintIntelligentFactory {
    // Events
    event NFTContractCreated(
        address indexed contractAddress,
        address indexed owner,
        string name,
        string symbol,
        address royaltyReceiver,
        uint96 royaltyFee
    );
    
    event NFTMinted(
        address indexed contractAddress,
        address indexed to,
        uint256 indexed tokenId,
        string uri
    );
    
    // Storage
    address[] public deployedContracts;
    mapping(address => address[]) public ownerToContracts;
    mapping(address => bool) public isDeployedContract;
    
  
    
    // Create new NFT contract
    function createNFTContract(
        string memory _name,
        string memory _symbol,
        address _royaltyReceiver,
        uint96 _royaltyFee
    ) 
        public  
        returns (address) 
    {
        require(_royaltyFee <= 10000, "Royalty fee too high"); // Max 100%
        
        // Deploy new NFT contract
        NFT newContract = new NFT(
            _name,
            _symbol,
            _royaltyReceiver,
            _royaltyFee
        );
        
        address contractAddress = address(newContract);
        
        // Store contract info
        deployedContracts.push(contractAddress);
        ownerToContracts[msg.sender].push(contractAddress);
        isDeployedContract[contractAddress] = true;
        
        // Emit event
        emit NFTContractCreated(
            contractAddress,
            msg.sender,
            _name,
            _symbol,
            _royaltyReceiver,
            _royaltyFee
        );
        
        return contractAddress;
    }
    
    // Mint NFT on existing contract
    function mintNFT(
        address _contractAddress,
        address _to,
        string memory _uri,
        address _royaltyReceiver,
        uint96 _royaltyFee
    )
        public
        returns (uint256)
    {
        require(isDeployedContract[_contractAddress], "Contract not deployed by factory");
        
        NFT nftContract = NFT(_contractAddress);
        
        uint256 tokenId = nftContract.safeMint(_to, _uri, _royaltyReceiver, _royaltyFee);
        
        emit NFTMinted(_contractAddress, _to, tokenId, _uri);
        
        return tokenId;
    }
    
    
    // Get contracts deployed by owner
    function getContractsByOwner(address _owner) public view returns (address[] memory) {
        return ownerToContracts[_owner];
    }
    
    // Get all deployed contracts
    function getAllContracts() public view returns (address[] memory) {
        return deployedContracts;
    }
    
    // Get total number of deployed contracts
    function getTotalContracts() public view returns (uint256) {
        return deployedContracts.length;
    }
}