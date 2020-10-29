pragma solidity ^0.5.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/access/Roles.sol";
import "./Burnable.sol";

contract WrappedToken is
    Ownable,
    ERC20,
    ERC20Mintable,
    ERC20Pausable,
    Burnable
{
    function renounceOwnership() public onlyOwner {
        revert("renouncing ownership is blocked");
    }

    function removeMinter(address account) public onlyOwner {
        _removeMinter(account);
    }

    function removePauser(address account) public onlyOwner {
        _removePauser(account);
    }
}
