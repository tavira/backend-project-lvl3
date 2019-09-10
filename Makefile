install: install-deps

run:
	npx babel-node 'src/bin/cli.js' 10

install-deps:
	npm install

build:
	npx eslint .
	npm test
	rm -rf dist
	npm run build

test:
	npm test

lint:
	npx eslint .

publish:
	npx eslint .
	npm test
	rm -rf dist
	npm run build
	npm publish --dry-run

.PHONY: test
