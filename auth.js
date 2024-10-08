// auth.js
// For user authentication - Sign up, Verification and Login

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const fs = require("fs");
const path = require("path");

const { mongoose } = require("./db"); // Import mongoose from db.js
const saltRounds = 12;

const router = express.Router();
router.use(bodyParser.json());

const {Conductor,Manager,User} = require("./models/schema");


//--------------------------------------- HELPER FUNCTIONS ---------------------------------------//

//------------ read the HTML template file ------------//
const readHTMLTemplate = (verificationCode) => {
	verificationCode = String(verificationCode);

	if (typeof verificationCode !== "string") {
		throw new Error("Verification code must be a string");
	}

	const filePath = path.join(__dirname, "verificationEmail.html");
	let htmlTemplate = fs.readFileSync(filePath, "utf8");
	//htmlTemplate = htmlTemplate.replace('{{verificationCode}}', verificationCode);

	// Replace the placeholders with the actual characters
	for (let i = 0; i < 6; i++) {
		htmlTemplate = htmlTemplate.replace(`{{${i}}}`, verificationCode.charAt(i));
	}

	return htmlTemplate;
};

//------------ generate a random 6-digit verification code ------------//
const generateVerificationCode = () => {
	const min = 100000; // Minimum 6-digit number
	const max = 999999; // Maximum 6-digit number
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

//------------ send verification email ------------//
const sendVerificationEmail = async (email, verificationCode) => {
	console.log("\nsendVerificationEmail: started");

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "ezbus.srilanka@gmail.com",
			pass: "zpaj bgob mttc pumz",
		},
	});

	console.log("\nsendVerificationEmail: transporter started");

	const htmlTemplate = readHTMLTemplate(verificationCode);

	const mailOptions = {
		from: "ezbus.srilanka@gmail.com",
		to: email,
		subject: "Verify your | EZBus Passenger | account",
		html: htmlTemplate,
	};

	console.log("\nsendVerificationEmail: mailOptions started");

	await transporter.sendMail(mailOptions);
	console.log("Verification email sent to: " + email);
};

//------------------------------------------------------ END POINTS ------------------------------------------------------//

//------------------------------------- PASSENGER -------------------------------------//

//---------------- sign up passenger ----------------//
router.post("/signup/passenger", async (req, res) => {
	console.log("An user trying to sign up");
	try {
		const { name, email, password } = req.body;
		console.log(
			"request body: " +
				"name: " +
				name +
				", email: " +
				email +
				", password: " +
				password
		);

		// Check if the email is already registered
		const existingUser = await User.findOne({ email });

		if (existingUser) {
			if (existingUser.isVerified) {
				console.log("Email already registered");
				return res.status(208).json({ message: "Already registered" });
			} else {
				const deletionUser = await User.deleteOne({
					email: email,
				});

				if (deletionUser.deletedCount > 0) {
					console.log("Unverfied user deleted successfully");
				} else {
					console.log("Failed to delete unverfied user");
					return res.status(500).send("Failed to delete unverfied user");
				}
			}
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create a new user
		const newUser = new User({ name, email, password: hashedPassword });
		console.log("User created successfully");

		// Generate a verification token
		const verificationCode = generateVerificationCode();
		console.log("\nverificationCode: " + verificationCode);

		try {
			// Send verification email
			await sendVerificationEmail(newUser.email, verificationCode);
		} catch (error) {
			console.log(error);
			return res.status(500).json({ error });
		}

		console.log(
			"sendVerificationEmail Done: " +
				"email: " +
				newUser.email +
				" verificationToken: " +
				verificationCode
		);

		// Save the user to the database
		await newUser.save();
		console.log("newUser: " + JSON.stringify(newUser));

		// Generate a JWT token for the new user
		//const token = jwt.sign({ email: email }, 'your_secret_key', { expiresIn: '1h' });
		console.log("verificationCode: " + verificationCode);
		return res.status(201).json({ verificationCode: verificationCode });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- verify passenger ----------------//

// Endpoint to update user status to "verified" when provided with an email
router.post("/verify/passenger", async (req, res) => {
	const { email } = req.body;

	// Check if the email is provided
	if (!email) {
		console.log("Email is required in the request body.");
		return res
			.status(400)
			.json({ error: "Email is required in the request body." });
	}

	// Find the user by email (replace this with database query)
	const user = await User.findOne({ email });

	// Check if the user exists
	if (!user) {
		console.log("User not found.");
		return res.status(404).json({ error: "User not found." });
	}

	// Update user status to "verified"

	const verifiedUser = await User.findOneAndUpdate(
		{ email },
		{
			$set: {
				isVerified: true,
				timestamp: Date.now(),
			},
		},
		{ new: true }
	);

	console.log(verifiedUser);

	// Send a response
	console.log("User status updated to verified.");
	return res.status(200).json({ message: "User status updated to verified." });
});

//---------------- login passenger----------------//

router.post("/login/passenger", async (req, res) => {
	console.log("An user trying to login");
	try {
		const { email, password } = req.body;
		console.log(
			"request body: " + "email: " + email + ", password: " + password
		);

		const user = await User.findOne({ email });

		if (!user) {
			console.log("Incorrect email");
			return res.status(401).send("Incorrect email");
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			console.log("Incorrect password");
			return res.status(401).send("Incorrect password");
		}

		// Check if the email is verified
		if (!user.isVerified) {
			console.log("User is not verified");
			return res.status(406).send("Not verified");
		}

		// res.json({ token });
		console.log("Login successful");
		console.log("user: " + user);

		const objToSend = {
			name: user.name,
			email: user.email,
		};
		console.log("objToSend: " + JSON.stringify(objToSend));

		return res.status(200).send(JSON.stringify(objToSend));
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//------------------------------------- CONDUCTOR -------------------------------------//

//---------------- sign up conductor ----------------//
router.post("/signup/conductor", async (req, res) => {
	console.log("a conductor is trying to sign up");
	try {
		const { name, email, password, busNumber } = req.body;
		console.log(
			"request body: " +
				"name: " +
				name +
				", email: " +
				email +
				", password: " +
				password +
				", busNumber: " +
				busNumber
		);

		// Check if the email is already registered
		const existingUser = await Conductor.findOne({ email });

		if (existingUser) {
			if (existingUser.isVerified) {
				console.log("Email already registered");
				return res.status(208).json({ message: "Already registered" });
			} else {
				const deletionUser = await Conductor.deleteOne({
					email: email,
				});

				if (deletionUser.deletedCount > 0) {
					console.log("Unverfied user deleted successfully");
				} else {
					console.log("Failed to delete unverfied user");
					return res.status(500).send("Failed to delete unverfied user");
				}
			}
		} 

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create a new user
		const newUser = new Conductor({ name, email, password: hashedPassword });
		console.log("User created successfully");

		// Generate a verification token
		const verificationCode = generateVerificationCode();
		console.log("\nverificationCode: " + verificationCode);

		try {
			// Send verification email
			await sendVerificationEmail(newUser.email, verificationCode);
		} catch (error) {
			console.log(error);
			return res.status(500).json({ error });
		}

		console.log(
			"sendVerificationEmail Done: " +
				"email: " +
				newUser.email +
				" verificationToken: " +
				verificationCode
		);

		// Save the user to the database
		await newUser.save();
		console.log("newUser: " + JSON.stringify(newUser));

		// Generate a JWT token for the new user
		//const token = jwt.sign({ email: email }, 'your_secret_key', { expiresIn: '1h' });
		console.log("verificationCode: " + verificationCode);
		return res.status(201).json({ verificationCode: verificationCode });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- verify conductor ----------------//

// Endpoint to update user status to "verified" when provided with an email
router.post("/verify/conductor", async (req, res) => {
	const { email } = req.body;

	// Check if the email is provided
	if (!email) {
		console.log("Email is required in the request body.");
		return res
			.status(400)
			.json({ error: "Email is required in the request body." });
	}

	// Find the user by email (replace this with database query)
	const user = await Conductor.findOne({ email });

	// Check if the user exists
	if (!user) {
		console.log("User not found.");
		return res.status(404).json({ error: "User not found." });
	}

	// Update user status to "verified"

	const verifiedUser = await Conductor.findOneAndUpdate(
		{ email },
		{
			$set: {
				isVerified: true,
				timestamp: Date.now(),
			},
		},
		{ new: true }
	);

	console.log(verifiedUser);

	// Send a response
	console.log("User status updated to verified.");
	return res.status(200).json({ message: "User status updated to verified." });
});

//---------------- login conductor----------------//

router.post("/login/conductor", async (req, res) => {
	console.log("a conductor is trying to login");
	try {
		const { email, password } = req.body;
		console.log(
			"request body: " + "email: " + email + ", password: " + password
		);

		const user = await Conductor.findOne({ email });

		if (!user) {
			console.log("Incorrect email");
			return res.status(401).send("Incorrect email");
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			console.log("Incorrect password");
			return res.status(401).send("Incorrect password");
		}

		// Check if the email is verified
		if (!user.isVerified) {
			console.log("User is not verified");
			return res.status(406).send("Not verified");
		}

		// res.json({ token });
		console.log("Login successful");
		console.log("user: " + user);

		const objToSend = {
			name: user.name,
			email: user.email,
		};
		console.log("objToSend: " + JSON.stringify(objToSend));

		return res.status(200).send(JSON.stringify(objToSend));
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});



//------------------------------------- MANAGER -------------------------------------//

//---------------- sign up manager ----------------//
router.post("/signup/manager", async (req, res) => {
	console.log("a manager is trying to sign up");
	try {
		const { name, email, password } = req.body;
		console.log(
			"request body: " +
				"name: " +
				name +
				", email: " +
				email +
				", password: " +
				password
		);

		// Check if the email is already registered
		const existingUser = await Manager.findOne({ email });

		if (existingUser) {
			if (existingUser.isVerified) {
				console.log("Email already registered");
				return res.status(208).json({ message: "Already registered" });
			} else {
				const deletionUser = await Manager.deleteOne({
					email: email,
				});

				if (deletionUser.deletedCount > 0) {
					console.log("Unverfied user deleted successfully");
				} else {
					console.log("Failed to delete unverfied user");
					return res.status(500).send("Failed to delete unverfied user");
				}
			}
		} 

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create a new user
		const newUser = new Manager({ name, email, password: hashedPassword });
		console.log("User created successfully");

		// Generate a verification token
		const verificationCode = generateVerificationCode();
		console.log("\nverificationCode: " + verificationCode);

		try {
			// Send verification email
			await sendVerificationEmail(newUser.email, verificationCode);
		} catch (error) {
			console.log(error);
			return res.status(500).json({ error });
		}

		console.log(
			"sendVerificationEmail Done: " +
				"email: " +
				newUser.email +
				" verificationToken: " +
				verificationCode
		);

		// Save the user to the database
		await newUser.save();
		console.log("newUser: " + JSON.stringify(newUser));

		// Generate a JWT token for the new user
		//const token = jwt.sign({ email: email }, 'your_secret_key', { expiresIn: '1h' });
		console.log("verificationCode: " + verificationCode);
		return res.status(201).json({ verificationCode: verificationCode });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});

//---------------- verify manager ----------------//

// Endpoint to update user status to "verified" when provided with an email
router.post("/verify/manager", async (req, res) => {
	const { email } = req.body;

	// Check if the email is provided
	if (!email) {
		console.log("Email is required in the request body.");
		return res
			.status(400)
			.json({ error: "Email is required in the request body." });
	}

	// Find the user by email (replace this with database query)
	const user = await Manager.findOne({ email });

	// Check if the user exists
	if (!user) {
		console.log("User not found.");
		return res.status(404).json({ error: "User not found." });
	}

	// Update user status to "verified"

	const verifiedUser = await Manager.findOneAndUpdate(
		{ email },
		{
			$set: {
				isVerified: true,
				timestamp: Date.now(),
			},
		},
		{ new: true }
	);

	console.log(verifiedUser);

	// Send a response
	console.log("User status updated to verified.");
	return res.status(200).json({ message: "User status updated to verified." });
});

//---------------- login manager ----------------//

router.post("/login/manager", async (req, res) => {
	console.log("An user trying to login");
	try {
		const { email, password } = req.body;
		console.log(
			"request body: " + "email: " + email + ", password: " + password
		);

		const user = await Manager.findOne({ email });

		if (!user) {
			console.log("Incorrect email");
			return res.status(401).send("Incorrect email");
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			console.log("Incorrect password");
			return res.status(401).send("Incorrect password");
		}

		// Check if the email is verified
		if (!user.isVerified) {
			console.log("User is not verified");
			return res.status(406).send("Not verified");
		}

		// res.json({ token });
		console.log("Login successful");
		console.log("user: " + user);

		const objToSend = {
			name: user.name,
			email: user.email,
		};
		console.log("objToSend: " + JSON.stringify(objToSend));

		return res.status(200).send(JSON.stringify(objToSend));
	} catch (error) {
		console.log(error);
		return res.status(500).json({ error: error.message });
	}
});




//---------------- protected route ----------------//

router.get("/protected", (req, res) => {
	// Middleware to check the JWT token before accessing the protected route
	const token = req.header("Authorization");

	if (!token) {
		return res
			.status(401)
			.json({ message: "Unauthorized - No token provided" });
	}

	jwt.verify(token, "your-secret-key", (err, decoded) => {
		if (err) {
			return res.status(401).json({ message: "Unauthorized - Invalid token" });
		}

		// The decoded object contains the payload of the JWT
		return res.json({ message: "Protected route accessed", user: decoded });
	});
});

module.exports = router;
