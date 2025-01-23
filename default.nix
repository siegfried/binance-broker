{
  pkgs ? import <nixpkgs> { },
}:
let
  pname = "binance-broker";
  version = "0.1.0";
  deps = pkgs.importNpmLock.buildNodeModules {
    npmRoot = ./.;
    nodejs = pkgs.nodejs;
  };
in
pkgs.stdenv.mkDerivation {
  inherit pname version;
  src = ./.;

  buildInputs = with pkgs; [
    nodejs
  ];

  buildPhase = ''
    rm -rf node_modules
    ln -s ${deps}/node_modules .
    npm run build
  '';

  installPhase = ''
    mkdir -p $out
    ln -s ${deps}/node_modules $out
    cp -r .next $out
    cp -r public $out
    cp package.json $out
    cp drizzle.config.ts $out
    mkdir -p $out/src/db
    cp src/db/schema.ts $out/src/db
  '';
}
