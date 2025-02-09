const { wipContractInstance } = require('../contract/contract');
const { UserData } = require('../models/userData');

const userController = {
    // Register a new user
    registerUser: async (req, res) => {
        try {
            const { username, email, company, tags, userAddress } = req.body;
            const { wipContract } = wipContractInstance();
            console.log(wipContract);

            const tx = await wipContract.registerUser(
                username,
                email,
                company,
                tags,
                userAddress
            );

            await tx.wait();

            // Save to MongoDB
            await UserData.create({
                username,
                email,
                company,
                tags,
                userAddress: userAddress.toLowerCase(),
                transactionHash: tx.hash
            });

            res.status(200).json({
                success: true,
                message: "User registered successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error registering user",
                error: error.message
            });
        }
    },

    // Update user information
    updateUser: async (req, res) => {
        try {
            const { username, email, company, tags, userAddress } = req.body;
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.updateUser(
                username,
                email,
                company,
                tags,
                userAddress
            );

            await tx.wait();

            // Update in MongoDB
            await UserData.findOneAndUpdate(
                { userAddress: userAddress.toLowerCase() },
                {
                    username,
                    email,
                    company,
                    tags,
                    transactionHash: tx.hash
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "User updated successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error updating user",
                error: error.message
            });
        }
    },

    // Get user data
    getUserData: async (req, res) => {
        try {
            const { userAddress } = req.params;
            const { wipContract } = wipContractInstance();

            const userData = await wipContract.getUserData(userAddress);

            res.status(200).json({
                success: true,
                data: {
                    username: userData.username,
                    email: userData.email,
                    company: userData.company,
                    tags: userData.tags,
                    certificateIds: userData.ids
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching user data",
                error: error.message
            });
        }
    },

    // Get certificates owned by user
    getUserCertificates: async (req, res) => {
        try {
            const { userAddress } = req.params;
            const { wipContract } = wipContractInstance();

            const certificates = await wipContract.getCertificatesByUser(userAddress);

            res.status(200).json({
                success: true,
                data: certificates
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching user certificates",
                error: error.message
            });
        }
    }
};

module.exports = userController;
