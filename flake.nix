{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-compat.url = "https://flakehub.com/f/edolstra/flake-compat/1.tar.gz";
  };

  outputs =
    { nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = nixpkgs.legacyPackages;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = pkgsFor.${system};
          startScriptBin = pkgs.writeShellScriptBin "start" ''
            ${pkgs.bun}/bin/bunx drizzle-kit push
            ${pkgs.bun}/bin/bun --bun run start
          '';
        in
        {
          default = pkgs.stdenv.mkDerivation {
            pname = "binance-broker";
            version = "0.1.0";
            src = ./.;

            buildInputs = with pkgs; [
              bun
            ];

            buildPhase = ''
              bun install
              bun run build
            '';

            installPhase = ''
              mkdir -p $out/app
              cp -r node_modules $out/app
              cp -r .next $out/app
              cp -r public $out/app
              cp package.json $out/app
              cp drizzle.config.ts $out/app
              mkdir -p $out/app/src/db
              cp src/db/schema.ts $out/app/src/db
              mkdir -p $out/app/bin
              cp ${startScriptBin}/bin/start $out/app/bin
            '';
          };
        }
      );
      devShells = forAllSystems (
        system:
        let
          pkgs = pkgsFor.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [ bun ];
          };
        }
      );
    };
}
