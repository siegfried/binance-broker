{
  pkgs ? import <nixpkgs> { },
}:
let
  pname = "binance-broker";
  version = "0.1.0";
  nodejs = pkgs.nodejs;
  npm = pkgs.nodePackages.npm;
  deps = pkgs.importNpmLock.buildNodeModules {
    npmRoot = ./.;
    inherit nodejs;
  };
in
pkgs.stdenv.mkDerivation {
  inherit pname version;
  src = ./.;

  buildPhase = ''
    rm -rf node_modules
    ln -s ${deps}/node_modules .
    ${npm}/bin/npm run build
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
    mkdir -p $out/bin
    cat << EOT > $out/bin/start
    #! ${pkgs.bash}/bin/bash
    export PATH=${
      pkgs.lib.makeBinPath [
        pkgs.nodejs
        pkgs.bash
      ]
    }:\$PATH
    ${npm}/bin/npx drizzle-kit push
    ${npm}/bin/npm run start
    EOT
    chmod +x $out/bin/start
  '';
}
