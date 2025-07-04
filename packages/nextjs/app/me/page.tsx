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

  Network,
  Shield,
  Sparkles,
  Zap,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { erc721Abi } from "viem";
import { useAccount } from "wagmi";
import { getAccount, multicall } from "wagmi/actions";
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
  const [expandedCards, setExpandedCards] = useState<ExpandedCards>({});

  const {
    data: nfts,
    isLoading,
    error,
  } = useQuery<NFTsResponse | null>({
    queryKey: ["nfts"],
    queryFn: async (): Promise<NFTsResponse | null> => {
      const account = getAccount(wagmiConfig)
      const address = account.address
      console.log({address})
      if(!address) return null
      const nftsForOwner = await alchemy.nft.getNftsForOwner(address);
      return nftsForOwner as NFTsResponse;
    },
    refetchInterval:5000
  });

  const toggleExpanded = (id: string): void => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getAgentIcon = (agentType: string) => {
    const iconMap: Record<string, any> = {
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
              <h1 className="text-5xl font-bold text-foreground">
                AI Agent Portfolio
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">Loading your AI agents...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i: number) => (
              <Card key={i} className="bg-card text-card-foreground border-border shadow-lg">
                <Skeleton className="w-full h-64 rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              AI Agent Portfolio
            </h1>
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">Error loading AI agents</p>
              <p className="text-destructive/80 text-sm mt-2">Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const agents: Agent[] = nfts?.ownedNfts ? nfts.ownedNfts.map(transformNftToAgent) : [];

  if (agents.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              AI Agent Portfolio
            </h1>
            <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-auto shadow-lg">
              <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2 text-foreground">No AI agents found</h2>
              <p className="text-muted-foreground">You haven't acquired any AI agents yet.</p>
              <p className="text-muted-foreground/80 text-sm mt-2">Start building your AI agent collection!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            AI Agent Portfolio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
                className="bg-card text-card-foreground rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-card-foreground">
                          {agent.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-muted-foreground">{agent.metadata.agent_type}</span>
                          <span className="w-1 h-1 bg-muted-foreground/40 rounded-full" />
                          <span className="text-sm text-muted-foreground">v{agent.metadata.version}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                        #{agent.id.split("-")[1]}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">{agent.tokenType}</div>
                    </div>
                  </div>

                  {/* Agent Image */}
                  <div className="relative mb-4 rounded-xl overflow-hidden bg-muted/30">
                    {agent.image ? (
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="w-full h-48 object-cover"
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
                      <IconComponent className="w-16 h-16 text-muted-foreground/40" />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-card-foreground/90 text-sm leading-relaxed mb-4">{agent.description}</p>

                  {/* Contract Info */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Collection: {agent.contract.name}</span>
                    <Badge variant="outline" className="border-border text-card-foreground/80">
                      {agent.contract.symbol}
                    </Badge>
                  </div>
                </div>

                {/* Capabilities Section */}
                <div className="relative">
                  <button
                    onClick={() => toggleExpanded(agent.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-accent transition-colors"
                  >
                    <span className="text-sm font-medium text-card-foreground">
                      Capabilities & Specifications ({agent.metadata.capabilities.length})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-3">
                      {agent.metadata.capabilities.map((capability: NFTAttribute, capIndex: number) => {
                        const CapIcon = getCapabilityIcon(capability.trait_type);
                        return (
                          <div
                            key={capIndex}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                          >
                            <div className="flex items-center space-x-3">
                              <CapIcon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-card-foreground">{capability.trait_type}</span>
                            </div>
                            <span className="text-sm font-medium text-primary">
                              {capability.display_type === "number" ? `${capability.value}` : capability.value}
                            </span>
                          </div>
                        );
                      })}

                      {/* Additional metadata */}
                      {agent.metadata.created_at && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center space-x-3">
                            <Cpu className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-card-foreground">Created</span>
                          </div>
                          <span className="text-sm font-medium text-primary">
                            {new Date(agent.metadata.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center space-x-3">
                          <Database className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-card-foreground">Balance</span>
                        </div>
                        <span className="text-sm font-medium text-primary">{agent.balance}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Updated */}
                <div className="px-6 pb-4">
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(agent.timeLastUpdated).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Portfolio Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border shadow-lg text-center">
            <CardContent className="p-6">
              <Bot className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">{agents.length}</div>
              <div className="text-sm text-muted-foreground">Active Agents</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg text-center">
            <CardContent className="p-6">
              <Network className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {new Set(agents.map((a: Agent) => a.contract.name)).size}
              </div>
              <div className="text-sm text-muted-foreground">Collections</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg text-center">
            <CardContent className="p-6">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {agents.filter((a: Agent) => a.tokenType === "ERC721").length}
              </div>
              <div className="text-sm text-muted-foreground">ERC721</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-lg text-center">
            <CardContent className="p-6">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-card-foreground">
                {agents.filter((a: Agent) => a.tokenType === "ERC1155").length}
              </div>
              <div className="text-sm text-muted-foreground">ERC1155</div>
            </CardContent>
          </Card>
        </div>

        {/* Blockchain Info */}
        {nfts?.validAt && (
          <Card className="mt-8 bg-card border-border shadow-lg">
            <CardContent className="p-4">
              <div className="text-center text-sm text-muted-foreground">
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