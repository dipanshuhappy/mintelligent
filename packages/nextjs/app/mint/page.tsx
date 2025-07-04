"use client";

import React, { useState } from "react";
import { uploadNFTAction } from "@/app/(actions)/upload-file";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, ImageIcon, Link as LinkIcon, Sparkles, Upload, X } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { parseEventLogs } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useChainId, useClient, useWriteContract } from "wagmi";
import { getAccount, getPublicClient, writeContract } from "wagmi/actions";
import { z } from "zod/v4";
import deployedContracts from "~~/contracts/deployedContracts";
import {
  useScaffoldContract,
  useScaffoldWriteContract,
  useSelectedNetwork,
  useTargetNetwork,
} from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

// Confetti component
const Confetti = ({ isActive }: { isActive: boolean }) => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map(piece => (
        <motion.div
          key={piece}
          className="absolute w-2 h-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
            y: -10,
            rotate: 0,
            opacity: 0,
          }}
          animate={
            isActive
              ? {
                  y: (typeof window !== "undefined" ? window.innerHeight : 1000) + 10,
                  rotate: 360,
                  opacity: [0, 1, 1, 0],
                }
              : {}
          }
          transition={{
            duration: 3,
            delay: Math.random() * 2,
            repeat: isActive ? Infinity : 0,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Collection validation schema
const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(50, "Name must be less than 50 characters"),
  symbol: z.string().min(1, "Symbol is required").max(10, "Symbol must be less than 10 characters"),
  royaltyReceiver: z.string().min(1, "Royalty receiver address is required").max(42, "Invalid address"),
  royaltyFee: z.number().min(0, "Royalty fee must be at least 0%").max(50, "Royalty fee cannot exceed 50%"),
});

// Updated NFT validation schema
const nftSchema = z.object({
  name: z.string().min(1, "NFT name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
  image: z.any().refine(file => file instanceof File, "Image file is required"),
});

type CollectionFormData = z.infer<typeof collectionSchema>;
type NFTFormData = z.infer<typeof nftSchema>;

export default function MintNFTPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [contractAddress, setContractAddress] = useState("");
  const [collection, setCollection] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [tokenId, setTokenId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMetadata, setUploadedMetadata] = useState<{
    imageCid?: string;
    metadataCid?: string;
    imageUrl?: string;
    metadataUrl?: string;
  } | null>(null);

  const { writeContractAsync: writeMintIntelligentFactory } = useScaffoldWriteContract({
    contractName: "MintIntelligentFactory",
  });

  // Collection form
  const collectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      symbol: "",
      royaltyReceiver: "",
      royaltyFee: 5,
    },
  });

  // NFT form with file handling
  const nftForm = useForm<NFTFormData>({
    resolver: zodResolver(nftSchema),
    defaultValues: {
      name: "",
      description: "",
      image: undefined,
    },
  });

  const { targetNetwork } = useTargetNetwork();

  const createCollection = useMutation({
    mutationFn: async (data: CollectionFormData) => {
      try {
        console.log({ data });
        const abi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts].MintIntelligentFactory.abi;
        const address =
          deployedContracts[targetNetwork.id as keyof typeof deployedContracts].MintIntelligentFactory.address;

        const hash = await writeContract(wagmiConfig, {
          args: [data.name, data.symbol, data.royaltyReceiver, BigInt(data.royaltyFee * 100)],
          functionName: "createNFTContract",
          abi,
          address,
        });

        const client = getPublicClient(wagmiConfig);
        if (!client) {
          throw new Error("Failed to get public client");
        }

        const receipt = await waitForTransactionReceipt(client, {
          hash,
        });

        const logs = parseEventLogs({
          abi,
          logs: receipt.logs,
          eventName: "NFTContractCreated",
        });

        if (logs.length === 0) {
          throw new Error("No NFTContractCreated event found in transaction");
        }

        const contractAddress = logs[0].args.contractAddress;
        setContractAddress(contractAddress);
        console.log({ hash, contractAddress });

        return {
          transactionHash: hash,
          contractAddress,
          ...data,
        };
      } catch (error) {
        console.error("Collection creation error:", error);
        throw error;
      }
    },
    onSuccess: data => {
      setCollection(data);
      setTransactionHash(data.transactionHash);
      toast.success("Collection created successfully! Now you can mint NFTs.");
      setCurrentStep(2);
    },
    onError: error => {
      console.error("Collection creation failed:", error);
      toast.error(error?.message || "Failed to create collection");
    },
  });

  const mintNFT = useMutation({
    mutationFn: async (data: { tokenURI: string }) => {
      try {
        const abi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts].MintIntelligentFactory.abi;
        const address =
          deployedContracts[targetNetwork.id as keyof typeof deployedContracts].MintIntelligentFactory.address;
        const account = getAccount(wagmiConfig);

        if (!account.address) {
          throw new Error("Please connect your wallet");
        }

        if (!contractAddress) {
          throw new Error("No collection contract address found");
        }

        const hash = await writeContract(wagmiConfig, {
          args: [contractAddress, account.address, data.tokenURI],
          functionName: "mintNFT",
          abi,
          address,
        });

        const client = getPublicClient(wagmiConfig);
        if (!client) {
          throw new Error("Failed to get public client");
        }

        const receipt = await waitForTransactionReceipt(client, {
          hash,
        });

        const logs = parseEventLogs({
          abi,
          logs: receipt.logs,
          eventName: "NFTMinted",
        });

        if (logs.length === 0) {
          throw new Error("No NFTMinted event found in transaction");
        }

        const tokenId = logs[0].args.tokenId;
        console.log({ hash, tokenId });

        return {
          transactionHash: hash,
          tokenId: tokenId.toString(),
          ...data,
        };
      } catch (error) {
        console.error("NFT minting error:", error);
        throw error;
      }
    },
    onSuccess: data => {
      setTransactionHash(data.transactionHash);
      setTokenId(data.tokenId);
      setShowSuccessModal(true);
      nftForm.reset();
      setPreviewImage(null);
      setSelectedFile(null);
      // Don't reset uploadedMetadata here so it shows in modal
    },
    onError: error => {
      console.error("NFT minting failed:", error);
      toast.error(error?.message || "Failed to mint NFT");
    },
  });

  const onCollectionSubmit: SubmitHandler<CollectionFormData> = data => {
    createCollection.mutate(data);
  };

  const onNFTSubmit: SubmitHandler<NFTFormData> = async data => {
    if (!selectedFile) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("name", data.name);
      formData.append("description", data.description);

      // Upload to Filebase/IPFS
      const uploadResult = await uploadNFTAction(formData);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Upload failed");
      }

      // Store the metadata CIDs for display
      setUploadedMetadata({
        imageCid: uploadResult.imageCid,
        metadataCid: uploadResult.metadataCid,
        imageUrl: uploadResult.imageUrl,
        metadataUrl: uploadResult.metadataUrl,
      });

      toast.success("Metadata uploaded to IPFS successfully!");

      // Use the metadata URL as tokenURI for minting
      if (uploadResult.imageCid) {
        await mintNFT.mutateAsync({ tokenURI: uploadResult.imageCid });
      } else {
        throw new Error("No metadata URL received from upload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      setSelectedFile(file);

      // Update form value
      nftForm.setValue("image", file);
      nftForm.clearErrors("image");
    } catch (error) {
      console.error("Error handling image:", error);
      toast.error("Error processing image file");
    }
  };

  const handleMintAnother = () => {
    setShowSuccessModal(false);
    setUploadedMetadata(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatTxHash = (hash: string) => {
    if (hash.length <= 20) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-10)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {currentStep === 1 ? "Create Collection" : "Mint NFT"}
            </h1>
            <p className="text-gray-300">
              {currentStep === 1
                ? "First, create your NFT collection with royalty settings"
                : "Now mint individual NFTs to your collection with IPFS storage"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= 1 ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"
                }`}
              >
                1
              </div>
              <div className={`w-12 h-0.5 ${currentStep >= 2 ? "bg-purple-600" : "bg-gray-700"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= 2 ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400"
                }`}
              >
                2
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Collection form */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Collection Details</CardTitle>
                    <CardDescription className="text-gray-400">
                      Set up your NFT collection with royalty settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={collectionForm.handleSubmit(onCollectionSubmit)} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="collectionName" className="text-gray-200">
                          Collection Name
                        </Label>
                        <Input
                          id="collectionName"
                          placeholder="My Awesome Collection"
                          {...collectionForm.register("name")}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        {collectionForm.formState.errors.name && (
                          <p className="text-sm text-red-400">{collectionForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collectionSymbol" className="text-gray-200">
                          Symbol
                        </Label>
                        <Input
                          id="collectionSymbol"
                          placeholder="AWESOME"
                          {...collectionForm.register("symbol")}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        {collectionForm.formState.errors.symbol && (
                          <p className="text-sm text-red-400">{collectionForm.formState.errors.symbol.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="royaltyReceiver" className="text-gray-200">
                          Royalty Receiver Address
                        </Label>
                        <Input
                          id="royaltyReceiver"
                          placeholder="0x..."
                          {...collectionForm.register("royaltyReceiver")}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        {collectionForm.formState.errors.royaltyReceiver && (
                          <p className="text-sm text-red-400">
                            {collectionForm.formState.errors.royaltyReceiver.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="royaltyFee" className="text-gray-200">
                          Royalty Fee (%)
                        </Label>
                        <Input
                          id="royaltyFee"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="5"
                          {...collectionForm.register("royaltyFee", { valueAsNumber: true })}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        <p className="text-xs text-gray-400">Enter percentage (e.g., 5 for 5%)</p>
                        {collectionForm.formState.errors.royaltyFee && (
                          <p className="text-sm text-red-400">{collectionForm.formState.errors.royaltyFee.message}</p>
                        )}
                      </div>

                      <div className="pt-4">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                          size="lg"
                          disabled={createCollection.isPending}
                        >
                          {createCollection.isPending ? (
                            <>
                              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                              Creating Collection...
                            </>
                          ) : (
                            <>
                              Create Collection
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Collection Info */}
                {collection && (
                  <Card className="bg-gray-800/50 border-gray-700 mb-6">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
                          <Badge variant="outline" className="mt-1 border-purple-500 text-purple-400">
                            {collection.symbol}
                          </Badge>
                          {contractAddress && (
                            <p className="text-xs text-gray-400 mt-1">
                              Contract: {formatTxHash(contractAddress)}
                              <button
                                onClick={() => copyToClipboard(contractAddress)}
                                className="ml-2 text-purple-400 hover:text-purple-300"
                              >
                                <Copy className="h-3 w-3 inline" />
                              </button>
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">NFT Details</CardTitle>
                    <CardDescription className="text-gray-400">
                      Create an individual NFT in your collection with IPFS storage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={nftForm.handleSubmit(onNFTSubmit)} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="image" className="text-gray-200">
                          NFT Image
                        </Label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-600 rounded-lg">
                          <div className="space-y-1 text-center">
                            {previewImage ? (
                              <div className="relative">
                                <img
                                  src={previewImage}
                                  alt="Preview"
                                  className="mx-auto h-48 w-48 object-cover rounded-md"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewImage(null);
                                    setSelectedFile(null);
                                    nftForm.setValue("image", undefined);
                                  }}
                                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex text-sm text-gray-400 justify-center">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer bg-transparent rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none"
                                  >
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                      <Upload className="h-12 w-12 text-gray-400" />
                                      <span>Upload a file</span>
                                      <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</span>
                                    </div>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      className="sr-only"
                                      onChange={handleImageUpload}
                                      accept="image/*"
                                      disabled={isUploading}
                                    />
                                  </label>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {nftForm.formState.errors.image && (
                          <p className="text-sm text-red-400">
                            {typeof nftForm.formState.errors.image.message === "string"
                              ? nftForm.formState.errors.image.message
                              : "Image is required"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nftName" className="text-gray-200">
                          NFT Name
                        </Label>
                        <Input
                          id="nftName"
                          placeholder="My Awesome NFT #1"
                          {...nftForm.register("name")}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        {nftForm.formState.errors.name && (
                          <p className="text-sm text-red-400">{nftForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-200">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="A brief description of your NFT"
                          rows={3}
                          {...nftForm.register("description")}
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        />
                        {nftForm.formState.errors.description && (
                          <p className="text-sm text-red-400">{nftForm.formState.errors.description.message}</p>
                        )}
                      </div>

                      {/* IPFS Upload Status */}
                      {uploadedMetadata && (
                        <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                          <h4 className="text-green-400 font-medium mb-2 flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            Successfully uploaded to IPFS
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Image CID:</span>
                              <div className="flex items-center space-x-2">
                                <code className="text-green-400 text-xs">{uploadedMetadata.imageCid}</code>
                                {uploadedMetadata.imageUrl && (
                                  <a
                                    href={uploadedMetadata.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Metadata CID:</span>
                              <div className="flex items-center space-x-2">
                                <code className="text-green-400 text-xs">{uploadedMetadata.metadataCid}</code>
                                {uploadedMetadata.metadataUrl && (
                                  <a
                                    href={uploadedMetadata.metadataUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300"
                                  >
                                    <LinkIcon className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                          size="lg"
                          disabled={mintNFT.isPending || isUploading || !selectedFile}
                        >
                          {isUploading ? (
                            <>
                              <Upload className="mr-2 h-4 w-4 animate-pulse" />
                              Uploading to IPFS...
                            </>
                          ) : mintNFT.isPending ? (
                            <>
                              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                              Minting NFT...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Upload & Mint NFT
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Success Modal - Enhanced with IPFS info */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-center text-white">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                NFT Minted Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-300 text-center">
                Your NFT has been minted and is now on the blockchain with IPFS metadata.
              </p>

              {/* Transaction Hash */}
              <div className="bg-gray-700 p-3 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono break-all text-gray-300">TX: {formatTxHash(transactionHash)}</p>
                  <button
                    onClick={() => copyToClipboard(transactionHash)}
                    className="text-purple-400 hover:text-purple-300 ml-2"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                {tokenId && <p className="text-xs text-gray-300 mt-2">Token ID: {tokenId}</p>}
              </div>

              {/* IPFS Information */}
              {uploadedMetadata && (
                <div className="bg-gray-700 p-3 rounded-md space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">Image IPFS:</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono break-all text-green-400 mr-2">{uploadedMetadata.imageCid}</p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyToClipboard(uploadedMetadata.imageCid || "")}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {uploadedMetadata.imageUrl && (
                          <a
                            href={uploadedMetadata.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Metadata IPFS:</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-mono break-all text-green-400 mr-2">{uploadedMetadata.metadataCid}</p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyToClipboard(uploadedMetadata.metadataCid || "")}
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {uploadedMetadata.metadataUrl && (
                          <a
                            href={uploadedMetadata.metadataUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300"
                          >
                            <LinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4 pt-2">
                <Button
                  variant="outline"
                  onClick={handleMintAnother}
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Mint Another NFT
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  asChild
                >
                  <a href="/me" className="no-underline">
                    View My NFTs
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Confetti isActive={showSuccessModal} />
      </div>
    </div>
  );
}
