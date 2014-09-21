BIN := ./node_modules/.bin
REPORTER ?= spec
SRC = $(wildcard lib/*.js)
TESTS = $(wildcard test/*.js test/**/*.js)
MOCA_OPT =

test:
	@$(BIN)/gnode $(BIN)/_mocha \
		--reporter $(REPORTER) \
		--require co-mocha \
		--timeout 5s \
		$(MOCA_OPT) \
		$(TESTS)

node_modules: package.json
	@npm install
	@touch node_modules

coverage: $(SRC) $(TESTS)
	@$(BIN)/gnode $(BIN)/istanbul cover \
	  $(BIN)/_mocha -- \
	    --reporter $(REPORTER) \
	    --require co-mocha \
	    --timeout 5s \
			$(TESTS)

clean:
	@rm -rf coverage
	@rm -rf examples/*/build

.PHONY: test clean
