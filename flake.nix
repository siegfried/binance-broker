{
  description = "Binance Broker";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-24.11";
  };

  outputs =
    { self, nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-darwin"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
          nodejs = pkgs.nodejs;
          lib = pkgs.lib;
        in
        {
          default = pkgs.buildNpmPackage {
            pname = "binance-broker";
            version = "0.1.0";
            src = ./.;
            buildInputs = [ nodejs ];
            npmDepsHash = "sha256-WdvjaoZn87bEY8ngJys1iZlqjBz1EVX3DN2Jct95GP8=";

            buildPhase = ''
              npm run build
            '';

            installPhase = ''
              mkdir -p $out
              cp -r node_modules $out
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
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [ pkgs.nodejs ];
          };
        }
      );
    };
}
