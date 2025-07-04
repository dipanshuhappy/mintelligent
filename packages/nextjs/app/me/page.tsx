"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Bot,
  Brain,
  ChevronDown,
  ChevronUp,
  Code,
  Cpu,
  Database,
  LucideIcon,
  Network,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { erc721Abi } from "viem";
import { useAccount } from "wagmi";
import { multicall } from "wagmi/actions";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { alchemy } from "~~/lib/alchemy";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

// Type definitions
interface NFTImage {
  cachedUrl?: string;
  thumbnailUrl?: string;
  pngUrl?: string;
  contentType?: string;
  size?: number;
  originalUrl?: string;
}

interface NFTAnimation {
  cachedUrl?: string;
  contentType?: string;
  size?: number;
  originalUrl?: string;
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  background_color?: string;
  attributes?: NFTAttribute[];
  agent_type?: string;
  version?: string;
  created_at?: string;
  image_cid?: string;
}

interface NFTRaw {
  tokenUri?: string;
  metadata?: NFTMetadata;
  error?: string | null;
}

interface NFTContract {
  address: string;
  name?: string;
  symbol?: string;
  totalSupply?: string | null;
  tokenType: string;
  contractDeployer?: string | null;
  deployedBlockNumber?: number | null;
  openSeaMetadata?: {
    floorPrice?: number | null;
    collectionName?: string | null;
    collectionSlug?: string | null;
    safelistRequestStatus?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    externalUrl?: string | null;
    twitterUsername?: string | null;
    discordUrl?: string | null;
    bannerImageUrl?: string | null;
    lastIngestedAt?: string | null;
  };
  isSpam?: boolean;
  spamClassifications?: string[];
}

interface NFTMint {
  mintAddress?: string | null;
  blockNumber?: number | null;
  timestamp?: string | null;
  transactionHash?: string | null;
}

interface NFTAcquiredAt {
  blockTimestamp?: string | null;
  blockNumber?: number | null;
}

interface NFT {
  contract: NFTContract;
  tokenId: string;
  tokenType: string;
  name?: string | null;
  description?: string | null;
  tokenUri?: string;
  image?: NFTImage;
  animation?: NFTAnimation;
  raw?: NFTRaw;
  collection?: any;
  mint?: NFTMint;
  owners?: any;
  timeLastUpdated: string;
  balance?: string;
  acquiredAt?: NFTAcquiredAt;
}

interface NFTsResponse {
  ownedNfts: NFT[];
  totalCount: number;
  validAt: {
    blockNumber: number;
    blockHash: string;
    blockTimestamp: string;
  };
  pageKey?: string | null;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  image?: string;
  contract: {
    name: string;
    symbol: string;
  };
  tokenType: string;
  metadata: {
    agent_type: string;
    version: string;
    created_at?: string;
    capabilities: NFTAttribute[];
  };
  timeLastUpdated: string;
  balance: string;
}

interface ExpandedCards {
  [key: string]: boolean;
}

export default function MyNFTsPage() {
  const { address } = useAccount();
  const [expandedCards, setExpandedCards] = useState<ExpandedCards>({});

  const {
    data: nfts,
    isLoading,
    error,
  } = useQuery<NFTsResponse | null>({
    queryKey: ["nfts"],
    queryFn: async (): Promise<NFTsResponse | null> => {
      if (!address) {
        return null;
      }
      const nftsForOwner = await alchemy.nft.getNftsForOwner(address);
      return nftsForOwner as NFTsResponse;
    },
  });

  const toggleExpanded = (id: string): void => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getAgentIcon = (agentType: string): LucideIcon => {
    const iconMap: Record<string, LucideIcon> = {
      "AI Assistant": Bot,
      "Data Analyst": Database,
      "Security AI": Shield,
      "Creative AI": Sparkles,
      "Reasoning AI": Brain,
      "Conversational AI": Bot,
      "Neural Network": Network,
    };
    return iconMap[agentType] || Cpu;
  };

  const getCapabilityIcon = (traitType: string): LucideIcon => {
    if (traitType.toLowerCase().includes("speed") || traitType.toLowerCase().includes("time")) return Zap;
    if (traitType.toLowerCase().includes("security") || traitType.toLowerCase().includes("protection")) return Shield;
    if (traitType.toLowerCase().includes("network") || traitType.toLowerCase().includes("processing")) return Network;
    if (traitType.toLowerCase().includes("code") || traitType.toLowerCase().includes("logic")) return Code;
    return Cpu;
  };

  const transformNftToAgent = (nft: NFT): Agent => {
    const metadata = nft.raw?.metadata || {};
    const attributes = metadata.attributes || [];

    return {
      id: `${nft.contract.address}-${nft.tokenId}`,
      name: nft.name || metadata.name || "Unnamed AI Agent",
      description:
        nft.description ||
        metadata.description ||
        "Advanced AI system with specialized capabilities for complex computational tasks.",
      image: nft.image?.cachedUrl || nft.image?.originalUrl || metadata.image,
      contract: {
        name: nft.contract.name || "AI Systems",
        symbol: nft.contract.symbol || "AI",
      },
      tokenType: nft.tokenType,
      metadata: {
        agent_type: metadata.agent_type || "AI Assistant",
        version: metadata.version || "1.0",
        created_at: metadata.created_at,
        capabilities:
          attributes.length > 0
            ? attributes
            : [
                { trait_type: "Processing Mode", value: "Advanced", display_type: "text" },
                { trait_type: "Token Standard", value: nft.tokenType, display_type: "text" },
              ],
      },
      timeLastUpdated: nft.timeLastUpdated,
      balance: nft.balance || "1",
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              AI Agent Portfolio
            </h1>
            <p className="text-xl text-slate-300">Loading your AI agents...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i: number) => (
              <Card key={i} className="overflow-hidden bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <Skeleton className="w-full h-64 rounded-t-lg bg-slate-700" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2 bg-slate-700" />
                  <Skeleton className="h-4 w-1/2 bg-slate-700" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2 bg-slate-700" />
                  <Skeleton className="h-4 w-2/3 bg-slate-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              AI Agent Portfolio
            </h1>
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
              <p className="text-red-300">Error loading AI agents</p>
              <p className="text-red-400/70 text-sm mt-2">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const agents: Agent[] = nfts?.ownedNfts ? nfts.ownedNfts.map(transformNftToAgent) : [];

  if (agents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              AI Agent Portfolio
            </h1>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 max-w-md mx-auto">
              <Bot className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2 text-white">No AI agents found</h2>
              <p className="text-slate-400">You haven't acquired any AI agents yet.</p>
              <p className="text-slate-500 text-sm mt-2">Start building your AI agent collection!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            AI Agent Portfolio
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Discover and manage your collection of {agents.length} advanced artificial intelligence agents, each with
            unique capabilities and specializations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent: Agent, index: number) => {
            const IconComponent = getAgentIcon(agent.metadata.agent_type);
            const isExpanded = expandedCards[agent.id];

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20"
              >
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Header */}
                <div className="relative p-6 border-b border-slate-700/50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {agent.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-slate-400">{agent.metadata.agent_type}</span>
                          <span className="w-1 h-1 bg-slate-600 rounded-full" />
                          <span className="text-sm text-slate-400">v{agent.metadata.version}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 hover:bg-slate-700">
                        #{agent.id.split("-")[1]}
                      </Badge>
                      <div className="text-xs text-slate-500 mt-1">{agent.tokenType}</div>
                    </div>
                  </div>

                  {/* Agent Image */}
                  <div className="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                    {agent.image ? (
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextSibling) {
                            (target.nextSibling as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div className={`${agent.image ? "hidden" : "flex"} w-full h-48 items-center justify-center`}>
                      <IconComponent className="w-16 h-16 text-slate-500" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-sm leading-relaxed mb-4">{agent.description}</p>

                  {/* Contract Info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Collection: {agent.contract.name}</span>
                    <Badge variant="outline" className="border-slate-600 text-slate-400">
                      {agent.contract.symbol}
                    </Badge>
                  </div>
                </div>

                {/* Capabilities Section */}
                <div className="relative">
                  <button
                    onClick={() => toggleExpanded(agent.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-300">
                      Capabilities & Specifications ({agent.metadata.capabilities.length})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3">
                      {agent.metadata.capabilities.map((capability: NFTAttribute, capIndex: number) => {
                        const CapIcon = getCapabilityIcon(capability.trait_type);
                        return (
                          <div
                            key={capIndex}
                            className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
                          >
                            <div className="flex items-center space-x-3">
                              <CapIcon className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-300">{capability.trait_type}</span>
                            </div>
                            <span className="text-sm font-medium text-cyan-400">
                              {capability.display_type === "number" ? `${capability.value}` : capability.value}
                            </span>
                          </div>
                        );
                      })}

                      {/* Additional metadata */}
                      {agent.metadata.created_at && (
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                          <div className="flex items-center space-x-3">
                            <Cpu className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-300">Created</span>
                          </div>
                          <span className="text-sm font-medium text-cyan-400">
                            {new Date(agent.metadata.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
                        <div className="flex items-center space-x-3">
                          <Database className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Balance</span>
                        </div>
                        <span className="text-sm font-medium text-cyan-400">{agent.balance}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0">
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25">
                      Activate Agent
                    </button>
                    <button className="px-4 py-2 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg transition-all duration-200">
                      Configure
                    </button>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="px-6 pb-4">
                  <div className="text-xs text-slate-500">
                    Last updated: {new Date(agent.timeLastUpdated).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Portfolio Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
            <CardContent className="p-6">
              <Bot className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{agents.length}</div>
              <div className="text-sm text-slate-400">Active Agents</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
            <CardContent className="p-6">
              <Network className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {new Set(agents.map((a: Agent) => a.contract.name)).size}
              </div>
              <div className="text-sm text-slate-400">Collections</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
            <CardContent className="p-6">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {agents.filter((a: Agent) => a.tokenType === "ERC721").length}
              </div>
              <div className="text-sm text-slate-400">ERC721</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 text-center">
            <CardContent className="p-6">
              <Sparkles className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {agents.filter((a: Agent) => a.tokenType === "ERC1155").length}
              </div>
              <div className="text-sm text-slate-400">ERC1155</div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Info */}
        {nfts?.validAt && (
          <Card className="mt-8 bg-slate-800/30 backdrop-blur-xl border-slate-700/30">
            <CardContent className="p-4">
              <div className="text-center text-sm text-slate-400">
                Data valid at block #{nfts.validAt.blockNumber} • Last synced:{" "}
                {new Date(nfts.validAt.blockTimestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
