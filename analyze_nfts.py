import json

with open(r'C:\Users\Sami\Desktop\nfts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=== NFTS.JSON STRUCTURE ANALYSIS ===\n")
print(f"Top-level keys: {list(data.keys())}")
print(f"Success: {data['success']}")
print(f"\nData keys: {list(data['data'].keys())}")
print(f"\nUsername: {data['data']['username']}")
print(f"User ID: {data['data']['user_id']}")
print(f"Total NFTs: {data['data']['total_nfts']}")
print(f"Total Upgraded: {data['data']['total_upgraded']}")
print(f"Total Unupgraded: {data['data']['total_unupgraded']}")
print(f"Total Value TON: {data['data']['total_value_ton']}")
print(f"Total Value USD: {data['data']['total_value_usd']}")

print(f"\n=== NFTs ARRAY ===")
print(f"Total items in 'nfts' array: {len(data['data']['nfts'])}")

upgraded = [nft for nft in data['data']['nfts'] if not nft.get('is_unupgraded', False)]
unupgraded = [nft for nft in data['data']['nfts'] if nft.get('is_unupgraded', False)]

print(f"Upgraded (NFTs): {len(upgraded)}")
print(f"Unupgraded (Regular): {len(unupgraded)}")

print(f"\n=== SAMPLE UPGRADED NFT ===")
if upgraded:
    sample = upgraded[0]
    print(json.dumps(sample, indent=2))

print(f"\n=== SAMPLE UNUPGRADED (REGULAR) NFT ===")
if unupgraded:
    sample = unupgraded[0]
    print(json.dumps(sample, indent=2))

print(f"\n=== PROFILE IMAGE ===")
print(f"Profile image URL: {data['data']['profile_information']['profile_image']}")
