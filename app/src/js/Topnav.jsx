import React from 'react'
import PropTypes from 'prop-types';
import {Navbar} from 'react-bootstrap';

const Topnav = (props) => {
    return (
        <Navbar bg="dark" variant="dark">
            <Navbar.Brand href="#home">{props.name}</Navbar.Brand>
        </Navbar>
    );
}

Topnav.propTypes = {
    name: PropTypes.string
}

export default Topnav