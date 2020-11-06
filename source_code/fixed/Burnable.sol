pragma solidity ^0.5.1;

// Original Code from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/token/ERC20/ERC20Burnable.sol

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
contract Burnable is Context, ERC20 {
    // Custom event for another blockchain
    event convertToken(uint256 amount, string username);

    /**
     * @dev Transfer `amount` tokens from the caller back to oracle owner.
     *
     * See {ERC20-_burn}.
     *
     * Requirements:
     *
     * - Blockchain `username`
     */
     function convertTokenWithTransfer(uint256 amount, string memory username) public {
       address depositAddress =;
       _transfer(_msgSender(), depositAddress, amount);
       emit convertToken(amount, username);
     }

    /**
     * @dev See {ERC20-_burnFrom}.
     *
     * Requirements:
     *
     * - Blockchain `username`
     */
    /* function convertTokenFromWithBurn(
        address account,
        uint256 amount,
        string memory username
    ) public {
        _burnFrom(account, amount);
        emit convertToken(amount, username);
    }     */
}
