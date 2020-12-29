:call babel.cmd build.js -o build6.js
call rollup.cmd -c
call babel.cmd build.js -o build6.js

:call babel.cmd flatland.js -o build6a.js
call google-closure-compiler.cmd  --compilation_level ADVANCED_OPTIMIZATIONS --language_out "ECMASCRIPT_2016"  --js=build6.js --js_output_file=build.min.js