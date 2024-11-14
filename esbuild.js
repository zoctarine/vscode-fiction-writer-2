const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({text, location}) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

async function main() {

    const buildOptions = {
        bundle: true,
        format: 'iife',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'browser',
        logLevel: 'info',
        plugins: [
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin,
        ],
        loader: { '.css': 'css' }
    };

    const mainCtx = esbuild.context({
        bundle: true,
        format: 'cjs',
        minify: false,
        sourcemap: true,
        sourcesContent: false,
        platform: 'node',
        external: ['vscode'],
        logLevel: 'silent',
        plugins: [
            /* add to the end of plugins array */
            esbuildProblemMatcherPlugin,
        ],
        entryPoints: ['src/extension.ts'],
        outfile: 'dist/extension.js',
    });

    const workerCtx = esbuild.context({
        ...buildOptions,
        platform: 'node',
        entryPoints: ['src/worker/worker.ts'],
        outfile: 'dist/worker/worker.js',
        external: ['vscode','worker_threads'],
    });

    const cmCtx = esbuild.context({
        ...buildOptions,
        entryPoints: ['src/modules/codeMirrorEditorView/browser/codeMirrorClient.ts'],
        outfile: 'dist/browser/codeMirrorClient.js',
    });

    const pmCtx = esbuild.context({
        ...buildOptions,
        entryPoints: ['src/modules/richTextEditor/browser/proseMirrorClient.ts'],
        outfile: 'dist/browser/proseMirrorClient.js',
    });

    const metaCtx = esbuild.context({
        ...buildOptions,
        entryPoints: ['src/modules/metadata/browser/metadataEditorClient.mts'],
        outfile: 'dist/browser/metadataEditorClient.js',
    });



    if (watch) {
        await Promise.all([
            mainCtx.then((ctx) => ctx.watch()),
            cmCtx.then((ctx) => ctx.watch()),
            pmCtx.then((ctx) => ctx.watch()),
            metaCtx.then((ctx) => ctx.watch()),
            workerCtx.then((ctx) => ctx.watch()),
        ]);
    } else {
        // Rebuild both bundles
        await Promise.all([
            mainCtx.then((ctx) => ctx.rebuild()),
            cmCtx.then((ctx) => ctx.rebuild()),
            pmCtx.then((ctx) => ctx.rebuild()),
            metaCtx.then((ctx) => ctx.rebuild()),
            workerCtx.then((ctx) => ctx.rebuild()),
        ]);

        await Promise.all([
            mainCtx.then((ctx) => ctx.dispose()),
            cmCtx.then((ctx) => ctx.dispose()),
            pmCtx.then((ctx) => ctx.dispose()),
            metaCtx.then((ctx) => ctx.dispose()),
            workerCtx.then((ctx) => ctx.dispose()),
        ]);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
//
// const esbuild = require("esbuild");
//
// const production = process.argv.includes('--production');
// const watch = process.argv.includes('--watch');
//
// /**
//  * @type {import('esbuild').Plugin}
//  */
// const esbuildProblemMatcherPlugin = {
//     name: 'esbuild-problem-matcher',
//
//     setup(build) {
//         build.onStart(() => {
//             console.log('[watch] build started');
//         });
//         build.onEnd((result) => {
//             result.errors.forEach(({ text, location }) => {
//                 console.error(`✘ [ERROR] ${text}`);
//                 console.error(`    ${location.file}:${location.line}:${location.column}:`);
//             });
//             console.log('[watch] build finished');
//         });
//     },
// };
//
// async function main() {
//     const ctx = await esbuild.context({
//         entryPoints: [
//             'src/extension.ts'
//         ],
//         breakOnLoad: true,
//         bundle: true,
//         format: 'cjs',
//         minify: production,
//         sourcemap: !production,
//         sourcesContent: false,
//         platform: 'node',
//         outfile: 'dist/extension.js',
//         external: ['vscode'],
//         logLevel: 'silent',
//         plugins: [
//             /* add to the end of plugins array */
//             esbuildProblemMatcherPlugin,
//         ],
//     });
//     if (watch) {
//         await ctx.watch();
//     } else {
//         await ctx.rebuild();
//         await ctx.dispose();
//     }
// }
// console.log('esbuild');
// main().catch(e => {
//     console.error(e);
//     process.exit(1);
// });
