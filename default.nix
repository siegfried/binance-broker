{
  pkgs ? import <Nixpkgs> { },
}:
pkgs.stdenv.mkDerivation {
  pname = "binance-broker";
  version = "0.1.0";
  src = ./.;

  nativeBuildInputs = with pkgs; [
    cacert
  ];

  propagatedNativeBuildInputs = with pkgs; [
    nodejs
    nodePackages.npm
  ];

  buildPhase = ''
    npm install
    npm run build
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
  '';
}
