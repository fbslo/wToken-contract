pragma solidity ^0.5.1;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "./WrappedToken.sol";

contract wToken is WrappedToken, ERC20Detailed("Wrapped Hive", "WHIVE", 3) {}
