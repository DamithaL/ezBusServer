const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { mongoose } = require("./db"); // Import mongoose from db.js
const { Conductor, Manager, User, BusFleet, Bus } = require("./models/schema");
const jwt = require("jsonwebtoken");

const bodyParser = require("body-parser");
router.use(bodyParser.json());

const merchantId = "1225343";

const generateProvisionalOrderId = () => {
	// Generate a provisional order ID using UUID
	const provisionalOrderId = uuidv4();
	return provisionalOrderId;
};

const ticketOrderSchema = new mongoose.Schema({
	ticket: {
		routeNumber: { type: String, required: true },
		routeName: { type: String, required: true },
		arrivalStopName: { type: String, required: true },
		departureStopName: { type: String, required: true },
		farePrice: { type: Number, required: true },
	},
	paymentNo: { type: String },
	orderId: { type: String, unique: true, required: true },
	userEmail: { type: String, ref: "User", required: true },
	purchasedDate: { type: Date },
	isRedeemed: { type: Boolean },
	busId: { type: String, ref: "Bus" },
	redeemedDate: { type: Date },
	timestamp: { type: Date, default: Date.now },
});

const TicketOrder = mongoose.model("TicketOrder", ticketOrderSchema);

//-------------------------------------------------- INITIATE --------------------------------------------------//

// END POINT TO INITIATE PAYMENT
router.post("/initiate", async (req, res) => {
	const ticketOrderRequest = req.body;

	console.log("payhere/initiate");
	console.log("ticketOrderRequest: " + JSON.stringify(ticketOrderRequest));

	if (await isTicketOrderValid(ticketOrderRequest)) {
		console.log("isValidPaymentRequest: true");
		saveTicketOrder(ticketOrderRequest, res);
	} else {
		console.log("isValidPaymentRequest: false");
		return res
			.status(400)
			.json({ error: "Invalid payment initiation request" });
	}
});

async function isTicketOrderValid(ticketOrderRequest) {
	console.log("isTicketOrderValid: started");
	const { ticket, userEmail } = ticketOrderRequest;
	if (ticket != null && userEmail != null) {
		const isUser = await User.findOne({ email: userEmail });
		if (isUser) {
			console.log("is an user");
			return true;
		}
	} else {
		return false;
	}
}

async function saveTicketOrder(ticketOrderRequest, res) {
	try {
		console.log("updateTicketOrder: started");
		const { ticket, userEmail } = ticketOrderRequest;

		const orderId = generateProvisionalOrderId();
		const amount = ticket.farePrice;
		const itemsDescription =
			"Route Number: " +
			ticket.routeNumber +
			" Route Name: " +
			ticket.routeName +
			" From: " +
			ticket.arrivalStopName +
			" To: " +
			ticket.departureStopName +
			" Fare Price: " +
			ticket.farePrice;

		const newPayHereOrder = {
			merchantId: merchantId,
			orderId: orderId,
			amount: amount,
			itemsDescription: itemsDescription,
		};

		// Save the new ticket order to the database
		const ticketOrderData = {
			ticket: {
				routeNumber: ticket.routeNumber,
				routeName: ticket.routeName,
				arrivalStopName: ticket.arrivalStopName,
				departureStopName: ticket.departureStopName,
				farePrice: ticket.farePrice,
			},
			paymentNo: null,
			userEmail: userEmail,
			orderId: orderId,
			purchasedDate: null,
			isRedeemed: false,
			busId: "null",
			redeemedDate: null,
		};

		const existingOrder = await TicketOrder.findOne({ orderId: orderId });
		if (existingOrder) {
			return res.status(400).json({ error: "Duplicate orderId detected" });
		}
		const ticketOrder = new TicketOrder(ticketOrderData);
		const savedTicketOrder = await ticketOrder.save();

		console.log(
			"TicketOrder saved successfully:",
			JSON.stringify(savedTicketOrder)
		);
		console.log("Payment initiation successful");
		console.log(
			"newPayHereOrder: ",
			newPayHereOrder + JSON.stringify(newPayHereOrder)
		);
		return res.status(201).send(JSON.stringify(newPayHereOrder));
	} catch (error) {
		return res.status(500).send("Error initiating payment");
	}
}

//-------------------------------------------------- PAID --------------------------------------------------//

// Endpoint to receive payment status updates from PayHere
// This will only receive the statuses if the users paid on their end
// Other instances such as cancelling or going back will not come here
router.post("/notify", async (req, res) => {
	console.log("Payment is successful");
	const paymentStatus = req.body;

	console.log("paymentStatus: " + JSON.stringify(paymentStatus));

	if (await isValidPaymentStatus(paymentStatus, res)) {
		console.log("isValidPaymentStatus: true ");
		try {
			const updatedOrder = await TicketOrder.findOneAndUpdate(
				{ orderId: paymentStatus.orderId },
				{
					$set: {
						paymentNo: paymentStatus.paymentNo,
						purchasedDate: paymentStatus.purchasedDate,
						timestamp: Date.now(),
					},
				},
				{ new: true } // Set to true to return the updated document
			);

			if (updatedOrder) {
				console.log("Order found and updated:", updatedOrder);
				return res.status(200).send("Payment status updated successfully");
			}
		} catch (error) {
			// THESE SHOULD BE REVISISTED SINCE ALTHOUGH THE ORDER IS NOT UPDATED, PAYMENT HAS BEEN DONE. SO SOMETHING HAS TO BE DONE.
			console.error("Error updating order:", error);
			return res.status(500).send('"Error updating order: ', error);
		}
	} else {
		console.log("isValidPaymentStatus: " + "Invalid payment status update");

		return res.status(400).send("Invalid payment status update");
	}
});

async function isValidPaymentStatus(paymentStatus) {
	console.log("isValidPaymentStatus: " + JSON.stringify(paymentStatus));
	const orderId = paymentStatus.orderId;
	console.log("orderId: " + orderId);
	if (orderId !== null && orderId !== "") {
		const order = await TicketOrder.findOne({ orderId: orderId });
		if (order) {
			console.log("order found");
			return true;
		} else {
			console.log("order not found");
			return false;
		}
	}
}

//-------------------------------------------------- CANCEL --------------------------------------------------//

router.post("/cancel", async (req, res) => {
	console.log("Payment is cancelled");
	const paymentStatus = req.body;

	console.log("paymentStatus: " + JSON.stringify(paymentStatus));

	if (paymentStatus.isOrderCancelled == true) {
		// Delete the found record
		const deletionResult = await TicketOrder.deleteOne({
			orderId: paymentStatus.orderId,
		});

		if (deletionResult.deletedCount > 0) {
			console.log("Order deleted successfully");
			return res.status(200).send("Order deleted successfully");
		} else {
			console.log("Failed to delete order");
			return res.status(500).send("Failed to delete order");
		}
	} else {
		console.log("Not deleted: Cancel command not found.");
		return res.status(404).send("Not deleted: Cancel command not found.");
	}
});

//-------------------------------------------------- VERIFY --------------------------------------------------//

//---------------- for conductor ----------------//

router.post("/verify-ticket", async (req, res) => {
	console.log("reqeust for verify-ticket received");
	console.log("reqeust body: " + JSON.stringify(req.body));
	try {
		// Extract orderId and userEmail from the request body
		const { orderId, hashedEmail } = req.body;
		console.log("orderId: " + orderId, "hashedEmail: " + hashedEmail);
		// Check if orderId and userEmail are provided
		if (!orderId || orderId === "" || !hashedEmail || hashedEmail === "") {
			return res.status(400).json({
				error: "orderId and email are required in the request body.",
			});
		}
		// Find the ticket order
		const existingOrder = await TicketOrder.findOne({ orderId: orderId });

		if (!existingOrder) {
			console.log("existingOrder not found");
			return res
				.status(404)
				.json({ valid: false, message: "Ticket not found." });
		}

		// Check if the hashed email matches
		const existingHashedEmail = generateHash(existingOrder.userEmail);
		if (hashedEmail !== existingHashedEmail) {
			console.log("email does not match");
			console.log(
				"newHashedEmail: " + hashedEmail,
				"existingHashedEmail: " + existingHashedEmail
			);
			return res
				.status(401)
				.json({ valid: false, message: "Email does not match." });
		}

		// Check if the ticket has been paid
		if (!existingOrder.paymentNo) {
			console.log("existingOrder not paid");
			return res
				.status(408)
				.json({ valid: false, message: "Ticket not paid." });
		}

		// Check if the ticket has already been redeemed
		if (existingOrder.isRedeemed) {
			const redeemedDate = existingOrder.redeemedDate;
			console.log("ticket already redeemed");
			return res.status(401).json({
				valid: false,
				redeemedDate: redeemedDate,
				message: "Ticket has already been redeemed.",
			});
		} else {
			console.log("ticket not redeemed");
			const ticket = {
				orderId: existingOrder.orderId,
				routeNumber: existingOrder.ticket.routeNumber,
				routeName: existingOrder.ticket.routeName,
				arrivalStopName: existingOrder.ticket.arrivalStopName,
				departureStopName: existingOrder.ticket.departureStopName,
				farePrice: existingOrder.ticket.farePrice,
			};
			console.log("ticket sent: " + JSON.stringify(ticket));
			return res.status(200).json({ valid: true, ticket: ticket });
		}
	} catch (error) {
		console.error("Error validating ticket redemption:", error);
		return res
			.status(500)
			.json({ valid: false, message: "Error validating ticket redemption." });
	}
});

//---------------- HASH ----------------//

const crypto = require("crypto");

function generateHash(input) {
	const hash = crypto.createHash("sha256");
	hash.update(input);
	return hash.digest("hex");
}

//---------------- for passengers ----------------//

router.post("/isTicketRedeemed", async (req, res) => {
	try {
		console.log("reqeust for isTicketRedeemed received");
		console.log("reqeust body: " + JSON.stringify(req.body));

		// Extract orderId and userEmail from the request body
		const { orderId, hashedEmail } = req.body;
		console.log("orderId: " + orderId, "hashedEmail: " + hashedEmail);
		// Check if orderId and userEmail are provided
		if (!orderId || orderId === "" || !hashedEmail || hashedEmail === "") {
			return res.status(400).json({
				error: "orderId and email are required in the request body.",
			});
		}
		// Find the ticket order
		const existingOrder = await TicketOrder.findOne({ orderId: orderId });

		if (!existingOrder) {
			console.log("existingOrder not found");
			return res
				.status(404)
				.json({ valid: false, message: "Ticket not found." });
		}

		// Check if the hashed email matches
		const existingHashedEmail = generateHash(existingOrder.userEmail);
		if (hashedEmail !== existingHashedEmail) {
			console.log("email does not match");
			console.log(
				"newHashedEmail: " + hashedEmail,
				"existingHashedEmail: " + existingHashedEmail
			);
			return res
				.status(401)
				.json({ valid: false, message: "Email does not match." });
		}

		// Check if the ticket has already been redeemed
		if (existingOrder.isRedeemed) {
			const redeemedDate = existingOrder.redeemedDate;
			console.error("redeemedDate: ", redeemedDate);
			return res.status(200).json({
				valid: false,
				redeemedDate: redeemedDate,
				message: "Ticket has already been redeemed.",
			});
		} else {
			return res.status(200).json({ valid: true, message: "Unused ticket." });
		}
	} catch (error) {
		console.error("Error validating ticket redemption:", error);
		return res
			.status(500)
			.json({ valid: false, message: "Error validating ticket redemption." });
	}
});

//-------------------------------------------------- REDEEM --------------------------------------------------//

router.post("/redeem-ticket", async (req, res) => {
	console.log("reqeust for redeem-ticket received");
	console.log("reqeust body: " + JSON.stringify(req.body));
	try {
		// Extract orderId and userEmail from the request body
		const { orderId, busRegNumber } = req.body;

		// Check if orderId and userEmail are provided
		if (!orderId || !busRegNumber) {
			console.log("orderId: " + orderId, "busRegNumber: " + busRegNumber);
			return res.status(400).json({
				error: "orderId and busRegNumber are required in the request body.",
			});
		}

		// Check if the ticket has already been redeemed
		const existingOrder = await TicketOrder.findOne({ orderId });

		if (!existingOrder) {
			console.log("existingOrder not found");
			return res
				.status(404)
				.json({ message: "Ticket not found." });
		}

		if (existingOrder.isRedeemed) {
			console.log("existingOrder already redeemed");
			return res
				.status(403)
				.json({ message: "Ticket has already been redeemed." });
		}

		// Find the bus
		const bus = await Bus.findOne({ busRegNumber: busRegNumber });
		if (!bus) {
			console.log("bus not found");
			return res.status(404).json({ error: "Bus not found" });
		}

		// Update the ticket order to mark it as redeemed
		const redeemedOrder = await TicketOrder.findOneAndUpdate(
			{ orderId },
			{
				$set: {
					busId: bus.busId,
					isRedeemed: true,
					redeemedDate: Date.now(),
				},
			},
			{ new: true }
		);

		if (redeemedOrder) {
			console.log("Ticket redeemed successfully: ", redeemedOrder);
			return res.status(200).json({ message: "Ticket redeemed successfully." });
		} else {
			return res
				.status(500)
				.json({ message: "Ticket redemption verification failed." });
		}
	} catch (error) {
		console.error("Error validating ticket redemption:", error);
		return res
			.status(500)
			.json({ message: "Error validating ticket redemption." });
	}
});

// Middleware for verifying JWT token
const verifyToken = (req, res, next) => {
	const token = req.header("Authorization");

	if (!token)
		return res
			.status(401)
			.json({ message: "Access denied. Token not provided." });

	try {
		const decoded = jwt.verify(token, "your_secret_key");
		console.log("111");
		req.user = decoded;
		console.log("222");
		next();
	} catch (error) {
		console.log(error);
		return res.status(401).json({ message: "Invalid token." });
	}
};

// Endpoint to get updated tickets
router.get("/tickets/updates", verifyToken, async (req, res) => {
	const { lastSyncTimestamp, orderIds, email } = req.body;

	// Check if the email matches the authenticated user's email
	if (email !== req.user.email) {
		return res
			.status(403)
			.json({ message: "Access forbidden. Email does not match." });
	}

	try {
		// Convert lastSyncTimestamp to Date object
		const lastSyncDate = new Date(lastSyncTimestamp);

		// Find updated tickets for the specified order IDs and timestamp
		const updatedTickets = await TicketModel.find({
			orderId: { $in: orderIds },
			timestamp: { $gt: lastSyncDate },
		});

		return res.json(updatedTickets);
	} catch (error) {
		console.error(error);
		return res.status(500).send("Internal Server Error");
	}
});

module.exports = router;
