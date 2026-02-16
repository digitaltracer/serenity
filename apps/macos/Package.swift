// swift-tools-version: 5.10

import PackageDescription

let package = Package(
  name: "SerenityMac",
  platforms: [.macOS(.v14)],
  products: [
    .executable(name: "SerenityMac", targets: ["SerenityMac"]),
  ],
  dependencies: [
    .package(url: "https://github.com/groue/GRDB.swift.git", from: "6.0.0"),
  ],
  targets: [
    .executableTarget(
      name: "SerenityMac",
      dependencies: [
        .product(name: "GRDB", package: "GRDB.swift"),
      ]
    ),
    .testTarget(
      name: "SerenityMacTests",
      dependencies: [
        "SerenityMac",
        .product(name: "GRDB", package: "GRDB.swift"),
      ]
    ),
  ],
)
