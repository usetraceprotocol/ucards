// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { FHE, euint128, inEuint128, ebool } from "@fhenixprotocol/contracts/FHE.sol";
import "./VoidFHERC20.sol";

/**
 * @title Void402Facilitator
 * @notice On-chain facilitator for x402 payments with FHE privacy
 * @dev Verifies and settles encrypted x402 payments without revealing amounts
 */
contract Void402Facilitator {
    // Reference to VoidFHERC20 token
    VoidFHERC20 public immutable token;

    // Payment request structure
    struct PaymentRequest {
        address payer;
        address payee;
        euint128 encryptedAmount; // Encrypted payment amount
        bytes32 paymentHash; // Hash of payment details for verification
        uint256 timestamp;
        bool settled;
    }

    // Mapping of payment requests
    mapping(bytes32 => PaymentRequest) public paymentRequests;

    // Events
    event PaymentRequested(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        bytes32 encryptedAmountHash,
        uint256 timestamp
    );

    event PaymentSettled(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        bytes32 encryptedAmountHash
    );

    event PaymentFailed(
        bytes32 indexed paymentId,
        string reason
    );

    constructor(address _tokenAddress) {
        token = VoidFHERC20(_tokenAddress);
    }

    /**
     * @notice Create a payment request for x402 payment
     * @param paymentId Unique identifier for the payment
     * @param payee Address receiving payment
     * @param encryptedAmount Encrypted payment amount (inEuint128)
     * @param paymentHash Hash of payment metadata (for verification)
     * @return success Whether payment request was created
     */
    function createPaymentRequest(
        bytes32 paymentId,
        address payee,
        inEuint128 calldata encryptedAmount,
        bytes32 paymentHash
    ) 
        public 
        returns (bool) 
    {
        require(
            paymentRequests[paymentId].timestamp == 0,
            "Payment ID already exists"
        );

        euint128 amount = FHE.asEuint128(encryptedAmount);

        paymentRequests[paymentId] = PaymentRequest({
            payer: msg.sender,
            payee: payee,
            encryptedAmount: amount,
            paymentHash: paymentHash,
            timestamp: block.timestamp,
            settled: false
        });

        bytes32 encryptedAmountHash = keccak256(encryptedAmount.data);
        emit PaymentRequested(
            paymentId,
            msg.sender,
            payee,
            encryptedAmountHash,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Settle an x402 payment (verify and transfer)
     * @param paymentId Payment identifier
     * @param encryptedAmount Encrypted amount to verify (inEuint128)
     * @param paymentHash Payment hash for verification
     * @return success Whether payment was settled
     * @return transferredAmount The actual amount transferred
     */
    function settlePayment(
        bytes32 paymentId,
        inEuint128 calldata encryptedAmount,
        bytes32 paymentHash
    )
        public
        returns (bool, euint128)
    {
        PaymentRequest storage request = paymentRequests[paymentId];
        
        require(request.timestamp != 0, "Payment request not found");
        require(!request.settled, "Payment already settled");
        require(request.paymentHash == paymentHash, "Invalid payment hash");

        // Verify encrypted amount matches using FHE comparison
        euint128 amount = FHE.asEuint128(encryptedAmount);
        ebool amountsMatch = FHE.eq(request.encryptedAmount, amount);
        require(
            FHE.decrypt(amountsMatch),
            "Encrypted amount mismatch"
        );

        // Transfer encrypted tokens from payer to payee
        euint128 transferredAmount = token.encryptedTransferFrom(
            request.payer,
            request.payee,
            encryptedAmount
        );

        // Check if transfer succeeded (transferred amount > 0)
        ebool transferSucceeded = FHE.gt(transferredAmount, FHE.asEuint128(0));
        if (!FHE.decrypt(transferSucceeded)) {
            emit PaymentFailed(paymentId, "Transfer failed");
            return (false, transferredAmount);
        }

        // Mark as settled
        request.settled = true;

        bytes32 encryptedAmountHash = keccak256(encryptedAmount.data);
        emit PaymentSettled(
            paymentId,
            request.payer,
            request.payee,
            encryptedAmountHash
        );

        return (true, transferredAmount);
    }

    /**
     * @notice Verify payment request exists and is valid
     * @param paymentId Payment identifier
     * @return exists Whether payment request exists
     * @return settled Whether payment is already settled
     * @return payee Address receiving payment
     */
    function verifyPaymentRequest(bytes32 paymentId)
        public
        view
        returns (
            bool exists,
            bool settled,
            address payee
        )
    {
        PaymentRequest storage request = paymentRequests[paymentId];
        exists = request.timestamp != 0;
        settled = request.settled;
        payee = request.payee;
    }

    /**
     * @notice Get payment request details (without revealing encrypted amount)
     * @param paymentId Payment identifier
     * @return payer Address making payment
     * @return payee Address receiving payment
     * @return timestamp When payment was requested
     * @return settled Whether payment is settled
     */
    function getPaymentRequest(bytes32 paymentId)
        public
        view
        returns (
            address payer,
            address payee,
            uint256 timestamp,
            bool settled
        )
    {
        PaymentRequest storage request = paymentRequests[paymentId];
        require(request.timestamp != 0, "Payment request not found");
        
        return (
            request.payer,
            request.payee,
            request.timestamp,
            request.settled
        );
    }
}

