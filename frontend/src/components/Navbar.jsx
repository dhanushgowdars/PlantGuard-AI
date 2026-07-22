import React from 'react';
import { NavLink, Link } from 'react-router-dom';
// 1. Import IoLeafSharp
import { IoLeafSharp } from 'react-icons/io5'; 
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          {/* 2. Use IoLeafSharp */}
          <IoLeafSharp className="navbar-logo-icon" /> PlantGuard AI 
        </NavLink>

        {/* Navigation Links */}
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink to="/" className="nav-links">Home</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/detect" className="nav-links">Detection Tool</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/encyclopedia" className="nav-links">Disease Encyclopedia</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/about" className="nav-links">About</NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/contact" className="nav-links">Contact</NavLink>
          </li>
        </ul>

        {/* Start Detection Button */}
        <div className="nav-button">
          <Link to="/detect" className="nav-button-link">
            Start Detection
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;