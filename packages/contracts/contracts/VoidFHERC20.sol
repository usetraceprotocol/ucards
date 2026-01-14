// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { FHE, euint128, inEuint128, ebool } from "@fhenixprotocol/contracts/FHE.sol";
import { Permissioned, Permission } from "@fhenixprotocol/contracts/access/Permissioned.sol";

/**
 * @title VoidFHERC20
 * @notice Encrypted ERC20 token for confidential balances and transfers
 * @dev Uses FHE to encrypt balances and transaction amounts
 */
contract VoidFHERC20 is ERC20, Permissioned {
    // Mapping from address to encrypted balance
    mapping(address => euint128) private _encryptedBalances;
    
    // Mapping from address to encrypted allowance
    mapping(address => mapping(address => euint128)) private _encryptedAllowances;

    // Total supply (encrypted)
    euint128 private _encryptedTotalSupply;

    // Privacy level enum
    enum PrivacyLevel {
        Public,      // Fully visible
        Partial,     // Amount hidden, parties visible
        Full         // Amount + parties hidden
    }

    // User privacy preferences
    mapping(address => PrivacyLevel) public privacyLevels;

    event EncryptedTransfer(
        address indexed from,
        address indexed to,
        bytes32 encryptedAmount,
        PrivacyLevel privacyLevel
    );

    event PrivacyLevelUpdated(address indexed user, PrivacyLevel level);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        // Mint initial supply using FHE
        euint128 encryptedInitial = FHE.asEuint128(initialSupply);
        _encryptedTotalSupply = encryptedInitial;
        _encryptedBalances[msg.sender] = encryptedInitial;
    }

    /**
     * @notice Get encrypted balance for a user (sealed output)
     * @param account Address to query
     * @param permission Permission struct with public key for sealing
     * @return Sealed encrypted balance as string
     */
    function getEncryptedBalance(
        address account,
        Permission calldata permission
    ) 
        public 
        view 
        onlyBetweenPermitted(permission, account, account)
        returns (string memory) 
    {
        return FHE.sealoutput(_encryptedBalances[account], permission.publicKey);
    }

    /**
     * @notice Transfer encrypted tokens (confidential)
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to transfer (inEuint128)
     * @return transferredAmount The actual amount transferred (may be less if insufficient balance)
     */
    function encryptedTransfer(
        address to,
        inEuint128 calldata encryptedAmount
    ) 
        public 
        returns (euint128) 
    {
        address from = msg.sender;
        euint128 amount = FHE.asEuint128(encryptedAmount);
        
        // Use FHE.select to conditionally transfer only if balance is sufficient
        // If balance >= amount, transfer amount; otherwise transfer 0
        euint128 amountToSend = FHE.select(
            FHE.gte(_encryptedBalances[from], amount),
            amount,
            FHE.asEuint128(0)
        );

        // Perform encrypted subtraction and addition using FHE operations
        _encryptedBalances[from] = _encryptedBalances[from] - amountToSend;
        _encryptedBalances[to] = _encryptedBalances[to] + amountToSend;

        // Emit encrypted transfer event (hash of encrypted amount for privacy)
        bytes32 encryptedAmountHash = keccak256(encryptedAmount.data);
        emit EncryptedTransfer(
            from,
            to,
            encryptedAmountHash,
            privacyLevels[from]
        );

        return amountToSend;
    }

    /**
     * @notice Set privacy level for user transactions
     * @param level Privacy level (Public, Partial, Full)
     */
    function setPrivacyLevel(PrivacyLevel level) public {
        privacyLevels[msg.sender] = level;
        emit PrivacyLevelUpdated(msg.sender, level);
    }

    /**
     * @notice Get privacy level for a user
     * @param account Address to query
     * @return Privacy level
     */
    function getPrivacyLevel(address account) 
        public 
        view 
        returns (PrivacyLevel) 
    {
        return privacyLevels[account];
    }

    /**
     * @notice Approve encrypted spending (for x402 facilitator)
     * @param spender Address to approve
     * @param encryptedAmount Encrypted amount to approve (inEuint128)
     * @return success Whether approval succeeded
     */
    function encryptedApprove(
        address spender, 
        inEuint128 calldata encryptedAmount
    ) 
        public 
        returns (bool) 
    {
        _encryptedAllowances[msg.sender][spender] = FHE.asEuint128(encryptedAmount);
        return true;
    }

    /**
     * @notice Get encrypted allowance (sealed output)
     * @param owner Token owner
     * @param spender Spender address
     * @param permission Permission struct with public key for sealing
     * @return Sealed encrypted allowance as string
     */
    function getEncryptedAllowance(
        address owner,
        address spender,
        Permission calldata permission
    )
        public
        view
        onlyBetweenPermitted(permission, owner, spender)
        returns (string memory)
    {
        return FHE.sealoutput(_encryptedAllowances[owner][spender], permission.publicKey);
    }

    /**
     * @notice Transfer from encrypted allowance (for facilitator)
     * @param from Sender address
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to transfer (inEuint128)
     * @return transferredAmount The actual amount transferred
     */
    function encryptedTransferFrom(
        address from,
        address to,
        inEuint128 calldata encryptedAmount
    )
        public
        returns (euint128)
    {
        euint128 amount = FHE.asEuint128(encryptedAmount);
        
        // Spend allowance: take minimum of allowance and requested amount
        euint128 spent = FHE.min(_encryptedAllowances[from][msg.sender], amount);
        _encryptedAllowances[from][msg.sender] = _encryptedAllowances[from][msg.sender] - spent;
        
        // Transfer: only transfer if balance is sufficient
        euint128 amountToSend = FHE.select(
            FHE.gte(_encryptedBalances[from], spent),
            spent,
            FHE.asEuint128(0)
        );

        // Perform FHE operations for balance updates
        _encryptedBalances[from] = _encryptedBalances[from] - amountToSend;
        _encryptedBalances[to] = _encryptedBalances[to] + amountToSend;

        // Emit event
        bytes32 encryptedAmountHash = keccak256(encryptedAmount.data);
        emit EncryptedTransfer(
            from,
            to,
            encryptedAmountHash,
            privacyLevels[from]
        );

        return amountToSend;
    }
}

