import React, { useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, CardBody, CardTitle, CardText, Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { motion } from "framer-motion";
import { Search } from "react-bootstrap-icons";

const App = () => {
    const [place, setPlace] = useState("");
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vehicleType, setVehicleType] = useState("all"); // New state for filtering

    const fetchRentals = async () => {
        if (!place) return;
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:5000/rentals", {
                params: { place },
            });

            const filteredRentals = response.data.filter(rental =>
                vehicleType === "all" ||
                (vehicleType === "car" && rental.name.toLowerCase().includes("car")) ||
                (vehicleType === "2-wheeler" && (rental.name.toLowerCase().includes("scooter") || rental.name.toLowerCase().includes("bike")))
            );

            setRentals(filteredRentals);
        } catch (error) {
            console.error("Error fetching rentals:", error);
        }
        setLoading(false);
    };

    return (
        <Container className="mt-5">
            <motion.h2 
                className="mb-4 text-center text-primary fw-bold" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 1 }}>
                Find Vehicle Rentals Near You
            </motion.h2>
            
            <Row className="justify-content-center mb-4">
                <Col md={6}>
                    <InputGroup>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter Place (e.g., New York)" 
                            value={place} 
                            onChange={(e) => setPlace(e.target.value)} 
                        />
                        <Form.Select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                            <option value="all">All Vehicles</option>
                            <option value="car">Car Rentals</option>
                            <option value="2-wheeler">2-Wheeler Rentals</option>
                        </Form.Select>
                        <Button variant="primary" onClick={fetchRentals}>
                            <Search size={20} />
                        </Button>
                    </InputGroup>
                </Col>
            </Row>
            
            {loading ? (
                <p className="text-center text-muted">Fetching rentals...</p>
            ) : (
                <Row>
                    {rentals.length > 0 ? (
                        rentals.map((rental) => (
                            <Col md={4} key={rental.id} className="mb-4">
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Card className="shadow-lg border-0 rounded">
                                        <CardBody className="text-center">
                                            <CardTitle className="fw-bold text-dark">{rental.name}</CardTitle>
                                            <CardText className="text-muted">{rental.address}</CardText>
                                            <CardText className="fw-bold text-warning">⭐ {rental.rating}</CardText>
                                        </CardBody>
                                    </Card>
                                </motion.div>
                            </Col>
                        ))
                    ) : (
                        <p className="text-center text-muted">No rentals found for this location.</p>
                    )}
                </Row>
            )}
        </Container>
    );
};

export default App;
