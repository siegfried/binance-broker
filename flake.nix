{
  description = "Binance Broker";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      # Use the same nixpkgs
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-compat.url = "https://flakehub.com/f/edolstra/flake-compat/1.tar.gz";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      gitignore,
      flake-compat,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        pname = "binance-broker";
        version = "0.1.0";
        nodejs = pkgs.nodejs;
        deps = pkgs.importNpmLock.buildNodeModules {
          npmRoot = ./.;
          inherit nodejs;
        };
        lib = pkgs.lib;
        inherit (gitignore.lib) gitignoreSource;
      in
      {
        packages = {
          default = pkgs.stdenv.mkDerivation {
            inherit pname version;
            src = gitignoreSource ./.;

            buildInputs = [ nodejs ];

            buildPhase = ''
              ln -s ${deps}/node_modules .
              npm run build
            '';

            installPhase = ''
              mkdir -p $out
              ln -s ${deps}/node_modules $out
              cp -r .next $out
              cp -r public $out
              cp -r drizzle $out
              cp package.json $out
              cp drizzle.config.ts $out
              mkdir -p $out/src/db
              cp src/db/schema.ts $out/src/db
              mkdir -p $out/bin
              cat << EOT > $out/bin/start
              #! ${lib.getExe pkgs.bash}
              export PATH=${
                lib.makeBinPath [
                  pkgs.bash
                  nodejs
                ]
              }:\$PATH
              npx drizzle-kit migrate
              npm run start
              EOT
              chmod +x $out/bin/start
            '';
          };
        };
      }
    );
}
