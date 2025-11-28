import React from 'react';
import { User, Calculator } from 'lucide-react';
import TonIcon from '@/components/TonIcon';

interface UserProfile {
  name: string;
  photo_base64: string | null;
}

interface NFTData {
  owner: string;
  visible_nfts?: number;
  total_saved_gifts?: number;
  prices: {
    floor_price: { TON: number; USD: number; STAR: number };
    avg_price: { TON: number; USD: number; STAR: number };
  };
  nfts: any[];
}

interface UserInfoHeaderProps {
  nftData: NFTData;
  searchedUserProfile: UserProfile | null;
  formatTON: (amount: number) => string;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({
  nftData,
  searchedUserProfile,
  formatTON,
}) => {
  return (
    <div className="telegram-card p-6 border border-border/50 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20 border border-primary/20">
            {searchedUserProfile?.photo_base64 ? (
              <img 
                src={`data:image/jpeg;base64,${searchedUserProfile.photo_base64}`}
                alt={searchedUserProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background shadow-sm">
            <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5 animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {searchedUserProfile?.name || nftData.owner}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            {nftData.owner.startsWith('@') ? nftData.owner : `@${nftData.owner}`} • {nftData.nfts?.length || nftData.visible_nfts || 0} Visible NFT Gifts
          </p>
          {nftData.total_saved_gifts && nftData.total_saved_gifts > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <p className="text-xs text-primary font-semibold">
                Total Saved: {nftData.total_saved_gifts}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Total Value Card */}
      {nftData.prices?.avg_price && (
        <div className="flex justify-center">
          <div className="w-full">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5 shadow-lg shadow-primary/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-muted-foreground">Total Value</span>
                  </div>
                  <div className="text-3xl font-bold text-gradient">
                    {formatTON(nftData.prices.avg_price.TON)} TON
                  </div>
                  <div className="text-base text-muted-foreground font-medium mt-0.5">
                    ${formatTON(nftData.prices.avg_price.USD)}
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <TonIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInfoHeader;
