Token Standard
As token usage has evolved on Solana, it has become clear that there are more types of tokens than simply "fungible" and "non-fungible" tokens.

An example is something the community is calling a "semi-fungible token", an SPL token with a supply greater than 1 but which has typical NFT attributes such as an image and an attributes array in the JSON metadata.

The consensus seems to be that these should be stored in wallets in the same view as standard NFTs, or in their own view but separate from "standard" fungible SPL tokens. These tokens are becoming popular in gaming contexts to support fungible items such as a kind of sword or a piece of wood, etc. but which are in a different league from typical fungible SPL tokens such as USDC.

The Token Standard field
In order to support this particular use-case but also to make the standard broad enough to allow expansion to other token types in the future, we keep track of the token's fungibility using the Token Standard enum on the Metadata account. This field maps to a particular JSON standard and is used to objectively differentiate token types.

This solves a pain point for third parties such as wallets which, before this field, had to apply inconsistent heuristics to determine what is and is not an "NFT".

The Token Standard field can have the following values:

0 / NonFungible: A non-fungible token with a Master Edition.
1 / FungibleAsset (1): A token with metadata that can also have attributes, sometimes called Semi-Fungible.
2 / Fungible (2): A token with simple metadata.
3 / NonFungibleEdition (3): A non-fungible token with an Edition account (printed from a Master edition).
4 / ProgrammableNonFungible (4): A special NonFungible token that is frozen at all times to enforce custom authorization rules.
It is important to note that the Token Standard is set automatically by the Token Metadata program and cannot be manually updated. It uses the following logic to apply the correct standard:

If the token has a Master Edition account, it is either a NonFungible or a ProgrammableNonFungible.
If the token has an Edition account, it is a NonFungibleEdition.
If the token has no (Master) Edition account (ensuring its supply can be > 1) and uses zero decimals places, it is a FungibleAsset.
If the token has no (Master) Edition account (ensuring its supply can be > 1) and uses at least one decimal place, it is a Fungible.
Each Token Standard type has its own JSON schema which is defined below.

The Fungible Standard
These are simple SPL tokens with limited metadata and supply >= 0. Examples are USDC, GBTC and RAY.

Field	Type	Description
name	string	Name of the asset.
symbol	string	Symbol of the asset.
description	string	Description of the asset.
image	string	URI pointing to the asset's logo.
Example
The Fungible Asset Standard
These are fungible tokens with more extensive metadata and supply >= 0. An example of this kind of token is something the community has been calling "semi-fungible tokens" often used to represent a fungible but attribute-heavy in-game item such as a sword or a piece of wood.

Field	Type	Description
name	string	Name of the asset.
description	string	Description of the asset.
image	string	URI pointing to the asset's logo.
animation_url	string	URI pointing to the asset's animation.
external_url	string	URI pointing to an external URL defining the asset — e.g. the game's main site.
attributes	array	Array of attributes defining the characteristics of the asset.
trait_type (string): The type of attribute.
value (string): The value for that attribute.
properties	object	Additional properties that define the asset.
files (array): Additional files to include with the asset.
uri (string): The file's URI.
type (string): The file's type. E.g. image/png, video/mp4, etc.
cdn (boolean, optional): Whether the file is served from a CDN.
category (string): A media category for the asset. E.g. video, image, etc.
Example
The Non-Fungible Standard
These are the "standard" non-fungible tokens the community is already familiar with and have both a Metadata PDA and a Master Edition (or Edition) PDA. Examples of these are Solana Monkey Business, Stylish Studs and Thugbirdz.

Field	Type	Description
name	string	Name of the asset.
description	string	Description of the asset.
image	string	URI pointing to the asset's logo.
animation_url	string	URI pointing to the asset's animation.
external_url	string	URI pointing to an external URL defining the asset — e.g. the game's main site.
attributes	array	Array of attributes defining the characteristics of the asset.
trait_type (string): The type of attribute.
value (string): The value for that attribute.
properties	object	Additional properties that define the asset.
files (array): Additional files to include with the asset.
uri (string): The file's URI.
type (string): The file's type. E.g. image/png, video/mp4, etc.
cdn (boolean, optional): Whether the file is served from a CDN.
category (string): A media category for the asset. E.g. video, image, etc.
Example
The Programmable Non-Fungible Standard
This standard is similar to the Non-Fungible standard above, except that the underlying token account is kept frozen at all times to ensure nobody can transfer, lock or burn Programmable NFTs without going through the Token Metadata program. This enables creators to define custom authorization rules for their NFTs such as enforcing secondary sales royalties.

You can read more about Programmable NFTs here.

Field	Type	Description
name	string	Name of the asset.
description	string	Description of the asset.
image	string	URI pointing to the asset's logo.
animation_url	string	URI pointing to the asset's animation.
external_url	string	URI pointing to an external URL defining the asset — e.g. the game's main site.
attributes	array	Array of attributes defining the characteristics of the asset.
trait_type (string): The type of attribute.
value (string): The value for that attribute.
properties	object	Additional properties that define the asset.
files (array): Additional files to include with the asset.
uri (string): The file's URI.
type (string): The file's type. E.g. image/png, video/mp4, etc.
cdn (boolean, optional): Whether the file is served from a CDN.
category (string): A media category for the asset. E.g. video, image, etc.