"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// Mock API function
const mockFetchNFTs = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      id: "1",
      name: "Cool Cat #1",
      symbol: "COOL",
      description: "A very cool cat NFT",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
      royaltyReceiver: "0x1234...7890",
      royaltyFee: 500,
    },
    {
      id: "2",
      name: "Space Dog #1",
      symbol: "SPACE",
      description: "An astronaut dog exploring the cosmos",
      image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop",
      royaltyReceiver: "0x0987...4321",
      royaltyFee: 750,
    },
  ];
};

export default function MyNFTsPage() {
  const {
    data: nfts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["nfts"],
    queryFn: mockFetchNFTs,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">My NFTs</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
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
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-red-500 mb-4">Error loading NFTs</h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My NFTs</h1>

      {nfts?.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No NFTs found</h2>
          <p className="text-muted-foreground">You haven't minted any NFTs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts?.map(nft => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img src={nft.image} alt={nft.name} className="w-full h-64 object-cover" />
                  <Badge className="absolute top-2 right-2 bg-black/70 hover:bg-black/80">
                    {nft.royaltyFee / 100}% Royalty
                  </Badge>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{nft.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{nft.symbol}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{nft.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <p>Royalty to: {nft.royaltyReceiver}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
