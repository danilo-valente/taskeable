#!/bin/bash

deno repl -A --eval "import * as mc from './main.ts'; Object.assign(window, mc);"
