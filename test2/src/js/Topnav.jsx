import React from 'react'
import PropTypes from 'prop-types';

const Navbar = (props) => {
    return (
    <nav className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
        <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="/">{props.name}</a>
    </nav>
    );
}

Navbar.propTypes = {
    name: PropTypes.string
}

export default Navbar