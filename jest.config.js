module.exports = {
    preset: 'ts-jest',
    modulePathIgnorePatterns: ["<rootDir>/dist/","<rootDir>/out/"],
    transform: {
        '^.+\\.(ts|tsx)?$': 'ts-jest',
    },
    testMatch: [
        '**/?(*.)+(spec|test).ts?(x)'  // Match only TypeScript test files
    ],
};