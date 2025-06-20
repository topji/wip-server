const { wipContractInstance } = require('../contract/contract');
const { UserData, CertificateData } = require('../models');


const certificateController = {
    // Create a new certificate
    createCertificate: async (req, res) => {
        try {
            const { 
                fileHash, 
                metadataURI, 
                description,
                fileFormat,
                owners
            } = req.body;
            
            const { wipContract } = wipContractInstance();

            // Validate total ownership percentage
            const totalPercentage = owners.reduce((sum, owner) => sum + owner.percentage, 0);
            if (totalPercentage !== 100) {
                return res.status(400).json({
                    success: false,
                    message: "Total ownership percentage must be 100%"
                });
            }

            // // Check if all owners are registered users
            // const ownerAddresses = owners.map(owner => owner.walletAddress.toLowerCase());
            // const registeredUsers = await UserData.find({
            //     userAddress: { $in: ownerAddresses }
            // });

            // // Create a set of registered addresses for easy lookup
            // const registeredAddresses = new Set(
            //     registeredUsers.map(user => user.userAddress.toLowerCase())
            // );

            // // Find unregistered addresses
            // const unregisteredAddresses = ownerAddresses.filter(
            //     address => !registeredAddresses.has(address.toLowerCase())
            // );

            // if (unregisteredAddresses.length > 0) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "All owners must be registered users",
            //         unregisteredAddresses
            //     });
            // }

            // Proceed with certificate creation on blockchain
            const tx = await wipContract.createCertificate(
                fileHash,
                metadataURI,
                owners[0].walletAddress // Only send the first owner's address to blockchain
            );

            const receipt = await tx.wait();
            console.log(receipt);
            // const certificateCreatedEvent = receipt.logs.find(
            //     log => {
            //         try {
            //             return wipContract.interface.parseLog({
            //                 topics: log.topics,
            //                 data: log.data
            //             })?.name === 'CertificateCreated'
            //         } catch (e) {
            //             return false;
            //         }
            //     }
            // );

            // const eventData = wipContract.interface.parseLog({
            //     topics: certificateCreatedEvent.topics,
            //     data: certificateCreatedEvent.data
            // });

            const certificateId = parseInt(await wipContract.certificateCounter());
            console.log(certificateId);
            const certificateDetails = await wipContract.getCertificateDetails(certificateId);
            console.log(certificateDetails);
            const timestamp = parseInt(certificateDetails.timestamp);
            console.log(timestamp);

            // Save to MongoDB with all owners and their percentages
            await CertificateData.create({
                certificateId,
                fileHash,
                metadataURI,
                description,
                fileFormat,
                timestamp: timestamp,
                owners: owners.map(owner => ({
                    walletAddress: owner.walletAddress.toLowerCase(),
                    percentage: owner.percentage
                })),
                updates: [],
                metadataUpdates: [],
                transactionHash: tx.hash
            });

            res.status(200).json({
                success: true,
                message: "Certificate created successfully",
                transaction: tx.hash,
                certificateId
            });
        } catch (error) {
            console.error('Certificate creation error:', error);
            res.status(500).json({
                success: false,
                message: "Error creating certificate",
                error: error.message
            });
        }
    },

    // Update an existing certificate
    updateCertificate: async (req, res) => {
        try {
            const { 
                certificateId, 
                updatedFileHash, 
                updatedMetadataURI,
                updatedDescription 
            } = req.body;
            
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.updateCertificate(
                certificateId,
                updatedFileHash,
                updatedMetadataURI
            );

            await tx.wait();

            // Get current certificate data
            const certificate = await CertificateData.findOne({ certificateId });
            
            // Update in MongoDB
            await CertificateData.findOneAndUpdate(
                { certificateId },
                {
                    $push: {
                        updates: updatedFileHash,
                        metadataUpdates: updatedMetadataURI
                    },
                    $set: {
                        fileHash: updatedFileHash,
                        description: updatedDescription
                    },
                    transactionHash: tx.hash
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Certificate updated successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error updating certificate",
                error: error.message
            });
        }
    },

    // Get certificate details
    getCertificateDetails: async (req, res) => {
        try {
            const { certificateId } = req.params;

            // Get data from MongoDB only
            const certificateData = await CertificateData.findOne({ certificateId });

            if (!certificateData) {
                return res.status(404).json({
                    success: false,
                    message: "Certificate not found"
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    id: certificateData.certificateId,
                    fileHash: certificateData.fileHash,
                    metadataURI: certificateData.metadataURI,
                    description: certificateData.description,
                    fileFormat: certificateData.fileFormat,
                    timestamp: certificateData.timestamp,
                    owners: certificateData.owners,
                    updates: certificateData.updates,
                    metadataUpdates: certificateData.metadataUpdates,
                    transactionHash: certificateData.transactionHash,
                    createdAt: certificateData.createdAt,
                    updatedAt: certificateData.updatedAt
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error fetching certificate details",
                error: error.message
            });
        }
    },

    // Transfer certificate ownership
    transferCertificate: async (req, res) => {
        try {
            const { certificateId, newOwner } = req.body;
            const { wipContract } = wipContractInstance();

            const tx = await wipContract.transferCertificateOwnership(
                certificateId,
                newOwner
            );

            await tx.wait();

            // Update ownership in MongoDB
            await CertificateData.findOneAndUpdate(
                { certificateId },
                { 
                    owner: newOwner.toLowerCase(),
                    transactionHash: tx.hash
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Certificate ownership transferred successfully",
                transaction: tx.hash
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error transferring certificate ownership",
                error: error.message
            });
        }
    },

    // Get all certificates for a user
    getUserCertificates: async (req, res) => {
        try {
            const { userAddress } = req.params;
            
            // Query MongoDB for certificates where the user is an owner
            const certificates = await CertificateData.find({
                'owners.walletAddress': userAddress.toLowerCase()
            }).select('certificateId fileHash description fileFormat timestamp owners');

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

module.exports = certificateController;
