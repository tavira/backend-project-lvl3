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
	npm test -- --coverage

test-watch:
	npm test -- --watch

lint:
	npx eslint .

publish: build
	npm publish --dry-run

install-app: publish
	npm link

.PHONY: test
