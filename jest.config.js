module.exports = {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat TypeScript files as ESM
    modulePathIgnorePatterns: ["<rootDir>/dist/","<rootDir>/out/"],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
        '^.+\\.(js|jsx)$': 'babel-jest',  // Add Babel for JS if needed
    },
    testMatch: [
        '**/?(*.)+(spec|test).ts?(x)'  // Match only TypeScript test files
    ],
    transformIgnorePatterns: [
        "<rootDir>/node_modules/(?!remark|remark-stringify|remark-parse|unified|remark-frontmatter)"
    ],

};