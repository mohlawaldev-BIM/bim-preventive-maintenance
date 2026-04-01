import ifcopenshell
import requests
from datetime import datetime
import sys

# Get project_id from command line argument
PROJECT_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 1
ifc_file = ifcopenshell.open("sample.ifc")

# These are IFC schema types that are NOT physical assets
# They are geometry, relationships, properties, or metadata
NON_ASSET_TYPES = {
    # Geometry
    "IfcPolyLoop", "IfcFaceOuterBound", "IfcFace", "IfcCartesianPoint",
    "IfcDirection", "IfcAxis2Placement3D", "IfcAxis2Placement2D",
    "IfcLocalPlacement", "IfcExtrudedAreaSolid", "IfcFacetedBrep",
    "IfcClosedShell", "IfcPolyline", "IfcCompositeCurveSegment",
    "IfcTrimmedCurve", "IfcCircle", "IfcPlane", "IfcLine",
    "IfcRectangleProfileDef", "IfcArbitraryClosedProfileDef",
    "IfcArbitraryProfileDefWithVoids", "IfcIShapeProfileDef",
    "IfcShapeRepresentation", "IfcProductDefinitionShape",
    "IfcRepresentationMap", "IfcMappedItem", "IfcFaceBasedSurfaceModel",
    "IfcConnectedFaceSet", "IfcFaceBound", "IfcBooleanClippingResult",
    "IfcHalfSpacesolid", "IfcPolygonalBoundedHalfSpace",
    "IfcCompositeCurve", "IfcCartesianTransformationOperator3D",
    # Properties & relationships
    "IfcPropertySet", "IfcPropertySingleValue", "IfcRelDefinesByProperties",
    "IfcRelDefinesByType", "IfcRelAssociatesMaterial", "IfcRelContainedInSpatialStructure",
    "IfcRelAggregates", "IfcRelVoidsElement", "IfcRelFillsElement",
    "IfcRelConnectsPathElements", "IfcRelConnectsPortToElement",
    "IfcRelAssignsToGroup", "IfcRelAssociatesClassification",
    "IfcElementQuantity", "IfcQuantityLength", "IfcQuantityArea",
    "IfcQuantityVolume", "IfcDerivedUnit", "IfcDerivedUnitElement",
    "IfcSiUnit", "IfcUnitAssignment", "IfcMeasureWithUnit",
    "IfcConversionBasedUnit", "IfcDimensionalExponents",
    # Materials
    "IfcMaterial", "IfcMaterialList", "IfcMaterialLayer",
    "IfcMaterialLayerSet", "IfcMaterialLayerSetUsage",
    "IfcMaterialDefinitionRepresentation",
    # Styles & presentation
    "IfcStyledItem", "IfcPresentationStyleAssignment", "IfcSurfaceStyle",
    "IfcSurfaceStyleRendering", "IfcColourRgb", "IfcStyledRepresentation",
    "IfcPresentationLayerAssignment",
    # Spatial structure (not maintainable assets)
    "IfcProject", "IfcSite", "IfcBuilding",
    "IfcGeometricRepresentationContext", "IfcGeometricRepresentationSubContext",
    # People & organizations
    "IfcPerson", "IfcOrganization", "IfcPersonAndOrganization",
    "IfcOwnerHistory", "IfcApplication", "IfcPostalAddress",
    # Types (definitions, not instances)
    "IfcWallType", "IfcDoorType", "IfcWindowType", "IfcSlabType",
    "IfcMemberType", "IfcPlateType", "IfcColumnType", "IfcBeamType",
    "IfcFurnitureType", "IfcFurnishingElementType", "IfcCoveringType",
    "IfcBuildingElementProxyType", "IfcDistributionElementType",
    "IfcSystemFurnitureElementType", "IfcSpaceType", "IfcCurtainWallType",
    "IfcWindowStyle", "IfcDoorStyle", "IfcStairFlightType",
    # Ports & distribution (abstract connectors, not assets)
    "IfcDistributionPort",
    # Groups
    "IfcGroup",
    # Classification
    "IfcClassification", "IfcClassificationReference",
    # Misc
    "IfcAxis", "IfcOpeningElement",
    # Door/Window properties — metadata, not physical assets
    "IfcDoorLiningProperties",
    "IfcDoorPanelProperties",
    "IfcWindowLiningProperties",
    "IfcWindowPanelProperties",
    "IfcDoorStyle",
    "IfcWindowStyle",
    # Spatial hierarchy — organizational, not maintainable assets
    "IfcBuilding",
    "IfcBuildingStorey",
    
    "IfcCartesianTransformationOperator",
    "IfcCartesianTransformationOperator3D",
    "IfcCartesianTransformationOperator2D",

    "IfcHalfSpaceSolid",
    "IfcHalfSpacesolid",
}

# Maintenance intervals by category (days)
DEFAULT_INTERVALS = {
    # MEP
    "FlowTerminal": 90,
    "FlowSegment": 180,
    "FlowFitting": 180,
    "FlowController": 90,
    "EnergyConversionDevice": 90,
    "DistributionFlowElement": 180,
    "DistributionElement": 180,
    "DistributionControlElement": 90,
    "ElectricAppliance": 90,
    "Pump": 90,
    "Fan": 90,
    "Boiler": 90,
    "Chiller": 90,
    "HeatExchanger": 180,
    "Valve": 90,
    "Filter": 60,
    "Tank": 180,
    "UnitaryEquipment": 90,
    "Sensor": 180,
    "Actuator": 180,
    "Alarm": 180,
    "LightFixture": 365,
    "Lamp": 365,
    "Outlet": 365,
    "SanitaryTerminal": 90,
    "WasteTerminal": 90,
    "StackTerminal": 180,
    "Interceptor": 90,
    "FireSuppressionTerminal": 90,
    "AirTerminal": 90,
    "AirTerminalBox": 90,
    # Structural
    "BuildingElementProxy": 90,
    "Member": 365,
    "Plate": 365,
    "Column": 365,
    "Beam": 365,
    "Pile": 730,
    "Footing": 730,
    # Architectural
    "Door": 180,
    "Window": 180,
    "CurtainWall": 180,
    "Wall": 730,
    "WallStandardCase": 730,
    "Slab": 730,
    "Roof": 180,
    "Ramp": 365,
    "Stair": 180,
    "StairFlight": 180,
    "Railing": 180,
    "Covering": 365,
    "Plate": 365,
    "FurnishingElement": 365,
    "Furniture": 365,
    "SystemFurnitureElement": 365,
    "Space": 90,
}


def discover_asset_types():
    """Dynamically discover all physical asset types in the IFC file"""
    all_types = set()
    for entity in ifc_file:
        all_types.add(entity.is_a())

    # Keep only types that are NOT in our exclusion list
    asset_types = all_types - NON_ASSET_TYPES

    # Also filter out any abstract spatial types
    asset_types = {
        t for t in asset_types
        if not t.startswith("IfcRel")        # relationships
        and not t.startswith("IfcPres")      # presentation
        and not t.endswith("Type")           # type definitions
        and "Profile" not in t               # profile definitions
        and "Representation" not in t        # representations
        and "Geometry" not in t              # geometry
        and "Context" not in t               # contexts
    }

    return asset_types


def get_property(element, prop_name):
    try:
        for definition in element.IsDefinedBy:
            if definition.is_a("IfcRelDefinesByProperties"):
                props = definition.RelatingPropertyDefinition
                if props.is_a("IfcPropertySet"):
                    for prop in props.HasProperties:
                        if prop.Name == prop_name:
                            return str(prop.NominalValue.wrappedValue)
    except:
        pass
    return None


def get_location(element):
    try:
        for rel in element.ContainedInStructure:
            return rel.RelatingStructure.Name
    except:
        pass
    return "Unknown"


def extract_assets():
    assets = []

    print("Scanning IFC file for asset types...")
    asset_types = discover_asset_types()
    print(f"Found {len(asset_types)} maintainable asset types: {', '.join(sorted(asset_types))}\n")

    for asset_type in sorted(asset_types):
        try:
            elements = ifc_file.by_type(asset_type)
            if not elements:
                continue

            print(f"Extracting {len(elements)} x {asset_type}...")

            for element in elements:
                category = asset_type.replace("Ifc", "")
                interval = DEFAULT_INTERVALS.get(category, 180)

                asset = {
                    "guid": element.GlobalId,
                    "name": element.Name or f"{category} - {element.GlobalId[:8]}",
                    "category": category,
                    "location": get_location(element),
                    "manufacturer": get_property(element, "Manufacturer") or "Unknown",
                    "installation_date": get_property(element, "InstallationDate") or "2020-01-01",
                    "maintenance_interval": interval,
                    "last_maintenance_date": "2024-01-01"
                }
                assets.append(asset)

        except Exception as e:
            print(f"Skipping {asset_type}: {e}")

    return assets


def send_to_backend(assets):
    url = "http://localhost:5000/api/assets/bulk"
    try:
        response = requests.post(url, json={"assets": assets, "projectId": PROJECT_ID})
        if response.status_code == 200:
            data = response.json()
            print(f"\nImport complete — Inserted: {data.get('inserted')} | Skipped: {data.get('skipped')}")
        else:
            print(f"\nError: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"\nCould not connect to backend: {e}")


if __name__ == "__main__":
    print("Starting IFC parser...\n")
    assets = extract_assets()

    if assets:
        print(f"\nTotal assets found: {len(assets)}")
        send_to_backend(assets)
    else:
        print("\nNo assets found in this IFC file.")