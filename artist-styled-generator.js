// Art styles based on famous artists
const ARTIST_STYLES = {
    mondrian: {
        elements: ['geometric', 'grid-based', 'rectangular', 'intersecting lines', 'balanced'],
        colors: ['primary red', 'primary blue', 'primary yellow', 'white', 'black'],
        techniques: ['hard-edge painting', 'geometric abstraction', 'grid composition', 'neoplasticism'],
        principles: ['asymmetrical balance', 'orthogonal lines', 'primary colors', 'geometric purity']
    },
    warhol: {
        elements: ['pop culture', 'repetition', 'iconic imagery', 'mass media', 'celebrity'],
        colors: ['bold complementary', 'neon pink', 'electric yellow', 'vibrant orange', 'contrasting pairs'],
        techniques: ['screen printing', 'photo manipulation', 'color blocking', 'repetitive patterns'],
        principles: ['mass production', 'popular culture', 'bold contrast', 'commercial art']
    },
    dali: {
        elements: ['melting objects', 'dreamscapes', 'surreal combinations', 'symbolic imagery', 'distorted reality'],
        colors: ['earth tones', 'desert hues', 'dramatic shadows', 'ethereal light', 'muted metallics'],
        techniques: ['hyperrealism', 'double imagery', 'paranoid-critical method', 'symbolic juxtaposition'],
        principles: ['dream logic', 'psychological symbolism', 'metamorphosis', 'subconscious expression']
    },
    pollock: {
        elements: ['dynamic movement', 'chaotic patterns', 'layered paint', 'gestural marks', 'abstract expression'],
        colors: ['overlapping palettes', 'dripped black', 'splattered primaries', 'organic combinations'],
        techniques: ['drip painting', 'action painting', 'all-over composition', 'spontaneous gesture'],
        principles: ['automatic creation', 'rhythmic movement', 'controlled chaos', 'abstract expressionism']
    }
};

// Extended themes incorporating artistic influences
const ARTISTIC_THEMES = [
    'modern life interpretation',
    'consumer culture critique',
    'subconscious manifestation',
    'geometric harmony',
    'celebrity and mass media',
    'dream analysis',
    'abstract expressionism',
    'technological surrealism',
    'spiritual geometry',
    'action and movement'
];

class ArtisticStyleGenerator {
    constructor() {
        this.currentArtist = null;
        this.currentTheme = null;
        this.currentComposition = null;
    }

    // Select a specific artist's style
    selectArtistStyle(artist) {
        if (ARTIST_STYLES[artist]) {
            this.currentArtist = artist;
            return artist;
        }
        return this.selectRandomArtistStyle();
    }

    // Select a random artist's style
    selectRandomArtistStyle() {
        const artists = Object.keys(ARTIST_STYLES);
        this.currentArtist = artists[Math.floor(Math.random() * artists.length)];
        return this.currentArtist;
    }

    // Select a theme appropriate for the chosen artist
    selectTheme() {
        let appropriateThemes = [...ARTISTIC_THEMES];
        
        // Add artist-specific themes
        switch(this.currentArtist) {
            case 'mondrian':
                appropriateThemes = appropriateThemes.concat([
                    'universal balance',
                    'spiritual order',
                    'mathematical harmony'
                ]);
                break;
            case 'warhol':
                appropriateThemes = appropriateThemes.concat([
                    'fame and identity',
                    'mass consumption',
                    'industrial reproduction'
                ]);
                break;
            case 'dali':
                appropriateThemes = appropriateThemes.concat([
                    'dream analysis',
                    'psychological time',
                    'subconscious desire'
                ]);
                break;
            case 'pollock':
                appropriateThemes = appropriateThemes.concat([
                    'cosmic energy',
                    'primal expression',
                    'rhythmic chaos'
                ]);
                break;
        }
        
        this.currentTheme = appropriateThemes[Math.floor(Math.random() * appropriateThemes.length)];
        return this.currentTheme;
    }

    // Generate a composition based on artist's style
    generateComposition() {
        const style = ARTIST_STYLES[this.currentArtist];
        const composition = {
            mainElements: style.elements[Math.floor(Math.random() * style.elements.length)],
            colorScheme: style.colors[Math.floor(Math.random() * style.colors.length)],
            technique: style.techniques[Math.floor(Math.random() * style.techniques.length)],
            principle: style.principles[Math.floor(Math.random() * style.principles.length)]
        };

        this.currentComposition = composition;
        return composition;
    }

    // Generate an artistic prompt based on selected artist and theme
    generateArtisticPrompt() {
        if (!this.currentArtist) this.selectRandomArtistStyle();
        if (!this.currentTheme) this.selectTheme();
        if (!this.currentComposition) this.generateComposition();

        const artisticPrompts = {
            mondrian: () => `Create a Mondrian-inspired composition using ${this.currentComposition.colorScheme} with ${this.currentComposition.mainElements} arrangement. 
                Employ ${this.currentComposition.technique} to explore ${this.currentTheme}. 
                Focus on ${this.currentComposition.principle} in the style of De Stijl movement.`,
            
            warhol: () => `Generate a Warhol-esque artwork featuring ${this.currentComposition.mainElements} using ${this.currentComposition.colorScheme} palette. 
                Apply ${this.currentComposition.technique} to comment on ${this.currentTheme}. 
                Emphasize ${this.currentComposition.principle} in true Pop Art fashion.`,
            
            dali: () => `Create a Dalí-inspired surrealist scene incorporating ${this.currentComposition.mainElements} with ${this.currentComposition.colorScheme} tones. 
                Utilize ${this.currentComposition.technique} to explore ${this.currentTheme}. 
                Express ${this.currentComposition.principle} in a surrealist manner.`,
            
            pollock: () => `Generate a Pollock-style abstract composition using ${this.currentComposition.colorScheme} through ${this.currentComposition.mainElements}. 
                Execute ${this.currentComposition.technique} to convey ${this.currentTheme}. 
                Embody ${this.currentComposition.principle} in the abstract expressionist tradition.`
        };

        const prompt = artisticPrompts[this.currentArtist]();

        return {
            prompt,
            artist: this.currentArtist,
            theme: this.currentTheme,
            composition: this.currentComposition
        };
    }

    // Generate metadata specific to the artistic style
    generateArtisticMetadata(artPrompt) {
        const attributes = [
            {
                trait_type: 'Artist Style',
                value: this.capitalize(this.currentArtist)
            },
            {
                trait_type: 'Artistic Movement',
                value: this.getArtisticMovement()
            },
            {
                trait_type: 'Theme',
                value: this.capitalize(this.currentTheme)
            },
            {
                trait_type: 'Technique',
                value: this.currentComposition.technique
            },
            {
                trait_type: 'Color Palette',
                value: this.currentComposition.colorScheme
            },
            {
                trait_type: 'Artistic Principle',
                value: this.currentComposition.principle
            }
        ];

        const name = `${this.capitalize(this.currentArtist)} Interpretation #${this.generateUniqueId()}`;

        return {
            name,
            description: `An artwork inspired by ${this.capitalize(this.currentArtist)}'s artistic style, exploring ${this.currentTheme}. ${artPrompt.prompt}`,
            attributes,
            properties: {
                artist_style: this.currentArtist,
                movement: this.getArtisticMovement(),
                theme: this.currentTheme,
                generation: {
                    type: 'AI-Generated Artist Interpretation',
                    technique: this.currentComposition.technique
                }
            }
        };
    }

    // Helper method to get the artistic movement
    getArtisticMovement() {
        const movements = {
            mondrian: 'De Stijl / Neoplasticism',
            warhol: 'Pop Art',
            dali: 'Surrealism',
            pollock: 'Abstract Expressionism'
        };
        return movements[this.currentArtist];
    }

    // Helper method to capitalize first letter
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Generate a unique ID for the artwork
    generateUniqueId() {
        return Math.floor(10000 + Math.random() * 90000);
    }

    // Reset the generator for a new artwork
    reset() {
        this.currentArtist = null;
        this.currentTheme = null;
        this.currentComposition = null;
    }
}

export const artisticGenerator = new ArtisticStyleGenerator();

// Usage example:
// const generator = new ArtisticStyleGenerator();
// generator.selectArtistStyle('mondrian');
// const prompt = generator.generateArtisticPrompt();
// const metadata = generator.generateArtisticMetadata(prompt);
