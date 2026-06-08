/**
 * Transformation helpers for CMVR store data to backend DTO format
 */

const sanitizeString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parseFirstNumber = (val) => {
  if (val === undefined || val === null) return undefined;
  const match = String(val).match(/-?\d*\.?\d+/);
  return match ? parseFloat(match[0]) : undefined;
};

const coerceBoolean = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = sanitizeString(value).toLowerCase();
  if (!normalized) return false;
  return ["true", "yes", "y", "1", "complied", "checked"].includes(normalized);
};

const coerceBooleanOrUndefined = (value) => {
  if (typeof value === "boolean") return value;
  const normalized = sanitizeString(value).toLowerCase();
  if (!normalized) return undefined;
  if (["true", "yes", "y", "1", "complied", "checked"].includes(normalized)) {
    return true;
  }
  if (["false", "no", "n", "0", "not complied"].includes(normalized)) {
    return false;
  }
  return undefined;
};

const interpretComplianceState = (value) => {
  if (typeof value === "boolean") return value ? "complied" : "notComplied";
  const normalized = sanitizeString(value).toLowerCase();
  if (!normalized) return undefined;
  if (["complied", "yes", "y", "true", "1"].includes(normalized)) {
    return "complied";
  }
  if (
    ["not complied", "notcomplied", "no", "n", "false", "0"].includes(
      normalized
    )
  ) {
    return "notComplied";
  }
  return undefined;
};

const hasMeaningfulValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
};

const buildComplianceSpecification = (field) => {
  if (!field) return "";
  const baseValue = sanitizeString(field.specification);
  const subFields = Array.isArray(field.subFields) ? field.subFields : [];
  if (!subFields.length) {
    return baseValue;
  }
  const specObject = {};
  if (baseValue) {
    specObject.main = baseValue;
  }
  subFields.forEach((subField, index) => {
    const label = sanitizeString(subField?.label || `Field ${index + 1}`)
      .replace(/:$/, "")
      .trim();
    const value = sanitizeString(subField?.specification);
    if (label && value) {
      specObject[label] = value;
    }
  });
  return Object.keys(specObject).length ? specObject : baseValue;
};

const buildProjectLocationSection = (rawSection) => {
  if (!rawSection || typeof rawSection !== "object") {
    return {
      parameters: [],
      otherComponents: [],
      uploadedImages: undefined,
    };
  }

  const formData =
    rawSection.formData && typeof rawSection.formData === "object"
      ? rawSection.formData
      : {};

  const parameters = Object.entries(formData)
    .map(([key, field]) => {
      const name = sanitizeString(field?.label || key);
      const specification = buildComplianceSpecification(field);
      const remarks = sanitizeString(field?.remarks);
      const withinSpecsValue =
        typeof field?.withinSpecs === "boolean"
          ? field.withinSpecs
          : coerceBoolean(field?.withinSpecs);

      if (
        !hasMeaningfulValue(specification) &&
        !remarks &&
        field?.withinSpecs == null
      ) {
        return null;
      }

      return {
        name,
        specification,
        remarks,
        withinSpecs: withinSpecsValue,
      };
    })
    .filter(Boolean);

  const otherComponentsSource = Array.isArray(rawSection.otherComponents)
    ? rawSection.otherComponents
    : [];

  const otherComponents = otherComponentsSource
    .map((component, index) => {
      const specification = sanitizeString(component?.specification);
      const remarks = sanitizeString(component?.remarks);
      const withinSpecsValue =
        typeof component?.withinSpecs === "boolean"
          ? component.withinSpecs
          : coerceBoolean(component?.withinSpecs);

      if (!specification && !remarks && component?.withinSpecs == null) {
        return null;
      }

      return {
        name: sanitizeString(component?.name) || `Other Component ${index + 1}`,
        specification,
        remarks,
        withinSpecs: withinSpecsValue,
      };
    })
    .filter(Boolean);

  const uploadedImages =
    rawSection.uploadedImages &&
    typeof rawSection.uploadedImages === "object" &&
    Object.keys(rawSection.uploadedImages).length
      ? rawSection.uploadedImages
      : undefined;

  return {
    parameters,
    otherComponents,
    uploadedImages,
  };
};

const mapOperationSectionToCommitments = (section, fallbackTitle) => {
  if (!section || section.isNA) return null;
  const areaName = sanitizeString(section.title || fallbackTitle);
  const measures = Array.isArray(section.measures) ? section.measures : [];

  const commitments = measures
    .map((measure) => {
      const planned = sanitizeString(measure?.planned);
      const observation = sanitizeString(measure?.actualObservation);
      const recommendations = sanitizeString(measure?.recommendations);
      const effectiveness = coerceBooleanOrUndefined(measure?.isEffective);

      if (!planned && !observation && !recommendations) {
        return null;
      }

      return {
        plannedMeasure: planned,
        actualObservation: observation,
        isEffective:
          effectiveness !== undefined
            ? effectiveness
            : coerceBoolean(measure?.isEffective),
        recommendations,
      };
    })
    .filter(Boolean);

  if (!commitments.length) {
    return null;
  }

  return {
    areaName,
    commitments,
  };
};

const buildImpactManagementSection = (rawSection) => {
  if (!rawSection || typeof rawSection !== "object") {
    return {
      constructionInfo: [],
      implementationOfEnvironmentalImpactControlStrategies: [],
      overallComplianceAssessment: "",
    };
  }

  const buildConstructionEntry = (label, value) => {
    // ✅ FIX: Always return entry for Pre-Construction and Construction with "N/A" if no value
    // These sections must always appear in CMVR reports
    return {
      areaName: label,
      commitments: [
        {
          plannedMeasure: `${label} compliance`,
          actualObservation: "N/A", // ✅ Always N/A for Pre-Construction and Construction
          isEffective: false,
          recommendations: "",
        },
      ],
    };
  };

  const constructionInfo = [
    buildConstructionEntry("Pre-Construction", rawSection.preConstruction),
    buildConstructionEntry("Construction", rawSection.construction),
  ]; // ✅ FIX: Don't filter - always include both entries

  const implementationSections = [
    mapOperationSectionToCommitments(
      rawSection.quarryOperation,
      "Quarry Operation"
    ),
    mapOperationSectionToCommitments(
      rawSection.plantOperation,
      "Plant Operation"
    ),
    mapOperationSectionToCommitments(
      rawSection.portOperation,
      "Port Operation"
    ),
  ].filter(Boolean);

  return {
    constructionInfo,
    implementationOfEnvironmentalImpactControlStrategies:
      implementationSections,
    overallComplianceAssessment: sanitizeString(rawSection.overallCompliance),
  };
};

/**
 * Transform Executive Summary structure
 */
export const transformExecutiveSummary = (executiveSummary) => {
  const summary = executiveSummary || {};
  const epep = summary.epepCompliance || {};
  const complaints = summary.complaintsManagement || {};

  const resolveSdmpState = () => {
    if (typeof summary.sdmpCompliance === "object") {
      if (summary.sdmpCompliance.complied) return "complied";
      if (summary.sdmpCompliance.notComplied) return "notComplied";
    }
    return interpretComplianceState(summary.sdmpCompliance);
  };

  const resolveAccountabilityState = () => {
    if (typeof summary.accountability === "object") {
      return {
        complied: !!coerceBoolean(summary.accountability.complied),
        notComplied: !!coerceBoolean(summary.accountability.notComplied),
      };
    }
    const interpreted = interpretComplianceState(summary.accountability);
    return {
      complied: interpreted === "complied",
      notComplied: interpreted === "notComplied",
    };
  };

  const sdmpState = resolveSdmpState();
  const accountabilityState = resolveAccountabilityState();

  return {
    complianceWithEpepCommitments: {
      safety: !!coerceBoolean(epep.safety),
      social: !!coerceBoolean(epep.social),
      rehabilitation: !!coerceBoolean(epep.rehabilitation),
      remarks: summary.epepRemarks || "",
    },
    complianceWithSdmpCommitments: {
      complied: sdmpState === "complied",
      notComplied: sdmpState === "notComplied",
      remarks: summary.sdmpRemarks || "",
    },
    complaintsManagement: {
      naForAll: !!coerceBoolean(complaints.naForAll),
      complaintReceivingSetup: !!coerceBoolean(
        complaints.complaintReceiving ?? complaints.complaintReceivingSetup
      ),
      caseInvestigation: !!coerceBoolean(complaints.caseInvestigation),
      implementationOfControl: !!coerceBoolean(
        complaints.implementationControl ?? complaints.implementationOfControl
      ),
      communicationWithComplainantOrPublic: !!coerceBoolean(
        complaints.communicationComplainant ??
          complaints.communicationWithComplainantOrPublic
      ),
      complaintDocumentation: !!coerceBoolean(
        complaints.complaintDocumentation
      ),
      remarks: summary.complaintsRemarks || complaints.remarks || "",
    },
    accountability: {
      complied: !!accountabilityState.complied,
      notComplied: !!accountabilityState.notComplied,
      remarks: summary.accountabilityRemarks || "",
    },
    others: {
      specify: summary.othersSpecify || "",
      na: !!coerceBoolean(summary.othersNA),
    },
  };
};

/**
 * Transform Process Documentation structure
 */
export const transformProcessDocumentation = (processDoc) => {
  if (!processDoc) {
    return {
      dateConducted: "",
      mergedMethodologyOrOtherRemarks: "",
      sameDateForAllActivities: false,
      activities: {
        complianceWithEccConditionsCommitments: { mmtMembersInvolved: [] },
        complianceWithEpepAepepConditions: { mmtMembersInvolved: [] },
        siteOcularValidation: { mmtMembersInvolved: [] },
        siteValidationConfirmatorySampling: {
          mmtMembersInvolved: [],
          dateConducted: "",
          applicable: false,
          none: false,
          remarks: "",
        },
      },
    };
  }

  const parseMembers = (text = "", extras = []) => {
    // ✅ FIX: Only split by newline, not comma, to preserve "Name, Position" as single entry
    const base = String(text)
      .split(/\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
    const additional = Array.isArray(extras)
      ? extras.map((entry) => sanitizeString(entry)).filter(Boolean)
      : [];
    return [...base, ...additional];
  };

  const existingActivities =
    (processDoc.activities && typeof processDoc.activities === "object"
      ? processDoc.activities
      : {}) || {};

  const eccMembers = parseMembers(
    processDoc.eccMmtMembers,
    processDoc.eccMmtAdditional
  );
  const epepMembers = parseMembers(
    processDoc.epepMmtMembers,
    processDoc.epepMmtAdditional
  );
  const ocularMembers = parseMembers(
    processDoc.ocularMmtMembers,
    processDoc.ocularMmtAdditional
  );
  const samplingMembers = parseMembers(processDoc.samplingMmtMembers);

  const resolveMembers = (activity, fallbackMembers) => {
    const members = Array.isArray(activity?.mmtMembersInvolved)
      ? activity.mmtMembersInvolved
          .filter(Boolean)
          .map((m) => sanitizeString(m))
      : [];
    return members.length ? members : fallbackMembers;
  };

  const sva = sanitizeString(processDoc.siteValidationApplicable).toLowerCase();
  const svaApplicable = ["yes", "y", "true"].includes(sva);
  const svaNone = ["no", "n", "none", "false"].includes(sva);

  const siteValidationSampling =
    existingActivities.siteValidationConfirmatorySampling || {};

  return {
    dateConducted: processDoc.dateConducted || "",
    mergedMethodologyOrOtherRemarks:
      processDoc.mergedMethodologyOrOtherRemarks ||
      processDoc.methodologyRemarks ||
      "",
    sameDateForAllActivities:
      processDoc.sameDateForAllActivities ?? processDoc.sameDateForAll ?? false,
    activities: {
      complianceWithEccConditionsCommitments: {
        mmtMembersInvolved: resolveMembers(
          existingActivities.complianceWithEccConditionsCommitments,
          eccMembers
        ),
      },
      complianceWithEpepAepepConditions: {
        mmtMembersInvolved: resolveMembers(
          existingActivities.complianceWithEpepAepepConditions,
          epepMembers
        ),
      },
      siteOcularValidation: {
        mmtMembersInvolved: resolveMembers(
          existingActivities.siteOcularValidation,
          ocularMembers
        ),
      },
      siteValidationConfirmatorySampling: {
        mmtMembersInvolved: resolveMembers(
          siteValidationSampling,
          samplingMembers
        ),
        dateConducted:
          siteValidationSampling.dateConducted ||
          processDoc.samplingDateConducted ||
          "",
        applicable: siteValidationSampling.applicable ?? svaApplicable ?? false,
        none: siteValidationSampling.none ?? svaNone ?? false,
        remarks:
          siteValidationSampling.remarks ||
          processDoc.samplingMethodologyRemarks ||
          "",
      },
    },
  };
};

const buildRecommendationsSection = (sections, quarter, year) => {
  if (!sections) return undefined;

  const transformed = {};

  if (quarter) {
    const match = String(quarter).match(/(\d+)/);
    if (match) {
      transformed.quarter = parseInt(match[1], 10);
    }
  }

  if (year) {
    const yearNum = parseInt(String(year), 10);
    if (!Number.isNaN(yearNum)) {
      transformed.year = yearNum;
    }
  }

  Object.keys(sections).forEach((key) => {
    const section = sections[key];
    if (
      section &&
      !section.isNA &&
      Array.isArray(section.items) &&
      section.items.length > 0
    ) {
      transformed[key] = section.items.map((item) => ({
        recommendation: item?.recommendation || "",
        commitment: item?.commitment || "",
        status: item?.status || "",
      }));
    }
  });

  const hasData = Object.keys(transformed).some(
    (key) => !["quarter", "year"].includes(key)
  );

  return hasData ? transformed : undefined;
};

const buildAirQualityImpactAssessment = (raw) => {
  if (!raw) return undefined;

  // Handle EnvironmentalComplianceScreen structure (quarry/plant/port as strings + shared table)
  if (raw.table && typeof raw.quarry === "string") {
    const result = {};

    // Map the shared table parameters
    const mapParameter = (param) => {
      const name = sanitizeString(param?.parameter || "");
      if (!name) return null;

      const remarks = sanitizeString(param?.remarks);
      const thirdParty = sanitizeString(param?.thirdPartyTesting);
      const mergedRemarks = thirdParty
        ? remarks
          ? `${remarks} | Third Party Testing: ${thirdParty}`
          : `Third Party Testing: ${thirdParty}`
        : remarks;

      return {
        name,
        results: {
          inSMR: {
            current: sanitizeString(param.currentSMR || ""),
            previous: sanitizeString(param.previousSMR || ""),
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(param.currentMMT || ""),
            previous: sanitizeString(param.previousMMT || ""),
          },
        },
        eqpl: {
          redFlag: sanitizeString(param.eqplRedFlag || ""),
          action: sanitizeString(param.action || ""),
          limit: sanitizeString(param.limitPM25 || ""),
        },
        remarks: mergedRemarks,
      };
    };

    const parameters = Array.isArray(raw.table.parameters)
      ? raw.table.parameters.map(mapParameter).filter(Boolean)
      : [];

    const sharedData = {
      parameters,
      samplingDate: sanitizeString(raw.table.dateTime || ""),
      weatherAndWind: sanitizeString(raw.table.weatherWind || ""),
      explanationForConfirmatorySampling: sanitizeString(
        raw.table.explanation || ""
      ),
      overallAssessment: sanitizeString(raw.table.overallCompliance || ""),
    };

    // Add location-specific mitigating measures with shared monitoring data
    if (raw.quarry && sanitizeString(raw.quarry)) {
      result.quarry = {
        locationDescription: sanitizeString(raw.quarry),
        ...sharedData,
      };
    }

    if (raw.plant && sanitizeString(raw.plant)) {
      result.plant = {
        locationDescription: sanitizeString(raw.plant),
        ...sharedData,
      };
    }

    if (raw.port && sanitizeString(raw.port)) {
      result.port = {
        locationDescription: sanitizeString(raw.port),
        ...sharedData,
      };
    }

    if (raw.quarryPlant && sanitizeString(raw.quarryPlant)) {
      result.quarryAndPlant = {
        locationDescription: sanitizeString(raw.quarryPlant),
        ...sharedData,
      };
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (raw.airQuality) {
    const result = {};

    if (raw.quarryEnabled && raw.quarry) {
      result.quarry = sanitizeString(raw.quarry);
      result.quarryEnabled = true;
    }
    if (raw.plantEnabled && raw.plant) {
      result.plant = sanitizeString(raw.plant);
      result.plantEnabled = true;
    }
    if (raw.quarryPlantEnabled && raw.quarryPlant) {
      result.quarryPlant = sanitizeString(raw.quarryPlant);
      result.quarryPlantEnabled = true;
    }
    if (raw.portEnabled && raw.port) {
      result.port = sanitizeString(raw.port);
      result.portEnabled = true;
    }

    const airQualityParams = [];

    if (raw.airQuality.parameter?.trim()) {
      airQualityParams.push({
        name: sanitizeString(raw.airQuality.parameter),
        results: {
          inSMR: {
            current: sanitizeString(raw.airQuality.currentSMR),
            previous: sanitizeString(raw.airQuality.previousSMR),
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(raw.airQuality.currentMMT),
            previous: sanitizeString(raw.airQuality.previousMMT),
          },
        },
        eqpl: {
          redFlag: sanitizeString(raw.airQuality.eqplRedFlag),
          action: sanitizeString(raw.airQuality.action),
          limit: sanitizeString(raw.airQuality.limitPM25),
        },
        remarks: sanitizeString(raw.airQuality.remarks),
      });
    }

    if (Array.isArray(raw.airQuality.parameters)) {
      raw.airQuality.parameters.forEach((param) => {
        if (param.parameter?.trim()) {
          airQualityParams.push({
            name: sanitizeString(param.parameter),
            results: {
              inSMR: {
                current: sanitizeString(param.currentSMR),
                previous: sanitizeString(param.previousSMR),
              },
              mmtConfirmatorySampling: {
                current: sanitizeString(param.currentMMT),
                previous: sanitizeString(param.previousMMT),
              },
            },
            eqpl: {
              redFlag: sanitizeString(param.eqplRedFlag),
              action: sanitizeString(param.action),
              limit: sanitizeString(param.limitPM25),
            },
            remarks: sanitizeString(param.remarks),
          });
        }
      });
    }

    result.airQuality = {
      parameters: airQualityParams,
      samplingDate: sanitizeString(raw.airQuality.dateTime),
      weatherAndWind: sanitizeString(raw.airQuality.weatherWind),
      explanationForConfirmatorySampling: sanitizeString(
        raw.airQuality.explanation
      ),
      overallAssessment: sanitizeString(raw.airQuality.overallCompliance),
    };

    return result;
  }

  const hasOldLocationStructure =
    raw.quarryData ||
    raw.plantData ||
    raw.portData ||
    raw.quarryPlantData ||
    raw.quarryAndPlantData;

  if (hasOldLocationStructure) {
    console.log("Using OLD LOCATION STRUCTURE branch");
    console.log("quarryData:", raw.quarryData);
    console.log("plantData:", raw.plantData);
    console.log("portData:", raw.portData);
    console.log("quarryPlantData:", raw.quarryPlantData);

    const result = {};

    const mergeRemarks = (param) => {
      const remarks = sanitizeString(param?.remarks);
      const thirdParty = sanitizeString(param?.thirdPartyTesting);
      if (!thirdParty) {
        return remarks;
      }
      const thirdPartyNote = `Third Party Testing: ${thirdParty}`;
      return remarks ? `${remarks} | ${thirdPartyNote}` : thirdPartyNote;
    };

    const mapParameter = (param = {}) => {
      const name = sanitizeString(param.parameter || param.name || "");
      if (!name) return null;
      return {
        name,
        results: {
          inSMR: {
            current: sanitizeString(param.currentSMR || param.inSMR || ""),
            previous: sanitizeString(param.previousSMR || ""),
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(
              param.currentMMT || param.mmtConfirmatorySampling || ""
            ),
            previous: sanitizeString(param.previousMMT || ""),
          },
        },
        eqpl: {
          redFlag: sanitizeString(param.eqplRedFlag || param.redFlag || ""),
          action: sanitizeString(param.action || ""),
          limit: sanitizeString(param.limitPM25 || param.limit || ""),
        },
        remarks: mergeRemarks(param),
      };
    };

    const transformLocationData = (locationData) => {
      if (!locationData) return null;

      const params = Array.isArray(locationData.parameters)
        ? locationData.parameters
            .map((param) => mapParameter(param))
            .filter(Boolean)
        : [];

      return {
        locationInput: sanitizeString(locationData.locationInput),
        parameters: params,
        samplingDate: sanitizeString(
          locationData?.samplingDate || locationData?.dateTime
        ),
        weatherAndWind: sanitizeString(
          locationData?.weatherAndWind || locationData?.weatherWind
        ),
        explanationForConfirmatorySampling: sanitizeString(
          locationData?.explanationForConfirmatorySampling ||
            locationData?.explanation
        ),
        overallAssessment: sanitizeString(
          locationData?.overallAssessment || locationData?.overallCompliance
        ),
      };
    };

    if (raw.quarryData) {
      const transformed = transformLocationData(raw.quarryData);
      if (transformed) result.quarry = transformed;
    }
    if (raw.plantData) {
      const transformed = transformLocationData(raw.plantData);
      if (transformed) result.plant = transformed;
    }
    if (raw.portData) {
      const transformed = transformLocationData(raw.portData);
      if (transformed) result.port = transformed;
    }
    if (raw.quarryPlantData || raw.quarryAndPlantData) {
      const transformed = transformLocationData(
        raw.quarryPlantData || raw.quarryAndPlantData
      );
      if (transformed) result.quarryAndPlant = transformed;
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  const sel = raw.selectedLocations || {};
  const d = raw.data || {};
  const params = Array.isArray(raw.parameters) ? raw.parameters : [];
  const ports = Array.isArray(raw.ports) ? raw.ports : [];

  const makeParam = (p) => {
    const name = sanitizeString(p?.parameter || "");
    if (!name) return null;
    return {
      name,
      results: {
        inSMR: {
          current: sanitizeString(
            p?.currentSMR || p?.tssCurrent || d?.tssCurrent || ""
          ),
          previous: sanitizeString(
            p?.previousSMR || p?.tssPrevious || d?.tssPrevious || ""
          ),
        },
        mmtConfirmatorySampling: {
          current: sanitizeString(
            p?.currentMMT || p?.mmtCurrent || d?.mmtCurrent || ""
          ),
          previous: sanitizeString(
            p?.previousMMT || p?.mmtPrevious || d?.mmtPrevious || ""
          ),
        },
      },
      eqpl: {
        redFlag: sanitizeString(p?.eqplRedFlag || d?.eqplRedFlag || ""),
        action: sanitizeString(p?.action || d?.action || ""),
        limit: sanitizeString(p?.limitPM25 || p?.limit || d?.limit || ""),
      },
      remarks: sanitizeString(p?.remarks || d?.remarks || ""),
    };
  };

  const result = {};

  if (sel.quarry && d?.quarryInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((p) => makeParam(p)).filter(Boolean);
    result.quarry = {
      locationDescription: sanitizeString(d?.quarryInput),
      parameters: [mainParam, ...extraParams].filter(Boolean),
      samplingDate: sanitizeString(d?.dateTime),
      weatherAndWind: sanitizeString(d?.weatherWind),
      explanationForConfirmatorySampling: sanitizeString(d?.explanation),
      overallAssessment: sanitizeString(d?.overallCompliance),
    };
  }

  if (sel.plant && d?.plantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((p) => makeParam(p)).filter(Boolean);
    result.plant = {
      locationDescription: sanitizeString(d?.plantInput),
      parameters: [mainParam, ...extraParams].filter(Boolean),
      samplingDate: sanitizeString(d?.dateTime),
      weatherAndWind: sanitizeString(d?.weatherWind),
      explanationForConfirmatorySampling: sanitizeString(d?.explanation),
      overallAssessment: sanitizeString(d?.overallCompliance),
    };
  }

  if (sel.quarryPlant && d?.quarryPlantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((p) => makeParam(p)).filter(Boolean);
    result.quarryAndPlant = {
      locationDescription: sanitizeString(d?.quarryPlantInput),
      parameters: [mainParam, ...extraParams].filter(Boolean),
      samplingDate: sanitizeString(d?.dateTime),
      weatherAndWind: sanitizeString(d?.weatherWind),
      explanationForConfirmatorySampling: sanitizeString(d?.explanation),
      overallAssessment: sanitizeString(d?.overallCompliance),
    };
  }

  if (ports?.length) {
    ports.forEach((port) => {
      const mainParam = makeParam(port);
      const extraParams = Array.isArray(port.additionalParameters)
        ? port.additionalParameters.map((p) => makeParam(p)).filter(Boolean)
        : [];

      result.port = {
        locationDescription: sanitizeString(
          port?.portName || port?.locationInput || d?.port || ""
        ),
        parameters: [mainParam, ...extraParams].filter(Boolean),
        samplingDate: sanitizeString(port?.dateTime || d?.dateTime),
        weatherAndWind: sanitizeString(port?.weatherWind || d?.weatherWind),
        explanationForConfirmatorySampling: sanitizeString(
          port?.explanation || d?.explanation
        ),
        overallAssessment: sanitizeString(
          port?.overallCompliance || d?.overallCompliance
        ),
      };
    });
  }

  return Object.keys(result).length ? result : undefined;
};

const buildWaterQualityImpactAssessment = (raw) => {
  if (!raw) return undefined;

  if (raw.waterQuality || raw.port || raw.portData || raw.portEnabled) {
    const result = {};

    if (raw.quarryEnabled && raw.quarry) {
      result.quarry = sanitizeString(raw.quarry);
    }
    if (raw.plantEnabled && raw.plant) {
      result.plant = sanitizeString(raw.plant);
    }
    if (raw.quarryPlantEnabled && raw.quarryPlant) {
      result.quarryPlant = sanitizeString(raw.quarryPlant);
    }

    result.quarryEnabled = !!raw.quarryEnabled;
    result.plantEnabled = !!raw.plantEnabled;
    result.quarryPlantEnabled = !!raw.quarryPlantEnabled;
    result.portEnabled = !!raw.portEnabled;

    if (raw.waterQuality) {
      const waterQualityParams = [];

      if (raw.waterQuality.parameter?.trim()) {
        waterQualityParams.push({
          name: sanitizeString(raw.waterQuality.parameter),
          result: {
            internalMonitoring: {
              month: sanitizeString(raw.waterQuality.resultType),
              readings: [
                {
                  label: sanitizeString(raw.waterQuality.parameter),
                  current_mgL: parseFirstNumber(raw.waterQuality.tssCurrent),
                  previous_mgL: parseFirstNumber(raw.waterQuality.tssPrevious),
                },
              ],
            },
            mmtConfirmatorySampling: {
              current: sanitizeString(raw.waterQuality.mmtCurrent),
              previous: sanitizeString(raw.waterQuality.mmtPrevious),
            },
          },
          denrStandard: {
            redFlag: sanitizeString(raw.waterQuality.eqplRedFlag),
            action: sanitizeString(raw.waterQuality.action),
            limit_mgL: parseFirstNumber(raw.waterQuality.limit),
          },
          remark: sanitizeString(raw.waterQuality.remarks),
        });
      }

      if (Array.isArray(raw.waterQuality.parameters)) {
        raw.waterQuality.parameters.forEach((param) => {
          if (param.parameter?.trim()) {
            waterQualityParams.push({
              name: sanitizeString(param.parameter),
              result: {
                internalMonitoring: {
                  month: sanitizeString(param.resultType),
                  readings: [
                    {
                      label: sanitizeString(param.parameter),
                      current_mgL: parseFirstNumber(param.tssCurrent),
                      previous_mgL: parseFirstNumber(param.tssPrevious),
                    },
                  ],
                },
                mmtConfirmatorySampling: {
                  current: sanitizeString(param.mmtCurrent),
                  previous: sanitizeString(param.mmtPrevious),
                },
              },
              denrStandard: {
                redFlag: sanitizeString(param.eqplRedFlag),
                action: sanitizeString(param.action),
                limit_mgL: parseFirstNumber(param.limit),
              },
              remark: sanitizeString(param.remarks),
            });
          }
        });
      }

      if (waterQualityParams.length > 0) {
        result.waterQuality = {
          parameters: waterQualityParams,
          samplingDate: sanitizeString(raw.waterQuality.dateTime),
          weatherAndWind: sanitizeString(raw.waterQuality.weatherWind),
          explanationForConfirmatorySampling: sanitizeString(
            raw.waterQuality.isExplanationNA
              ? "N/A"
              : raw.waterQuality.explanation
          ),
          overallAssessment: sanitizeString(raw.waterQuality.overallCompliance),
        };
      }
    }

    const portSource = isPlainObject(raw.portData)
      ? raw.portData
      : isPlainObject(raw.port)
        ? raw.port
        : {};
    const portDescription =
      typeof raw.port === "string"
        ? sanitizeString(raw.port)
        : sanitizeString(
            raw.portInput ||
              portSource.locationDescription ||
              portSource.portName ||
              portSource.locationInput
          );

    if (raw.portEnabled || portDescription || Object.keys(portSource).length) {
      const portParams = [];

      if (portSource.parameter?.trim()) {
        portParams.push({
          name: sanitizeString(portSource.parameter),
          result: {
            internalMonitoring: {
              month: sanitizeString(portSource.resultType),
              readings: [
                {
                  label: sanitizeString(portSource.parameter),
                  current_mgL: parseFirstNumber(portSource.tssCurrent),
                  previous_mgL: parseFirstNumber(portSource.tssPrevious),
                },
              ],
            },
            mmtConfirmatorySampling: {
              current: sanitizeString(portSource.mmtCurrent),
              previous: sanitizeString(portSource.mmtPrevious),
            },
          },
          denrStandard: {
            redFlag: sanitizeString(portSource.eqplRedFlag),
            action: sanitizeString(portSource.action),
            limit_mgL: parseFirstNumber(portSource.limit),
          },
          remark: sanitizeString(portSource.remarks),
        });
      }

      if (Array.isArray(portSource.additionalParameters)) {
        portSource.additionalParameters.forEach((param) => {
          if (param.parameter?.trim()) {
            portParams.push({
              name: sanitizeString(param.parameter),
              result: {
                internalMonitoring: {
                  month: sanitizeString(param.resultType),
                  readings: [
                    {
                      label: sanitizeString(param.parameter),
                      current_mgL: parseFirstNumber(param.tssCurrent),
                      previous_mgL: parseFirstNumber(param.tssPrevious),
                    },
                  ],
                },
                mmtConfirmatorySampling: {
                  current: sanitizeString(param.mmtCurrent),
                  previous: sanitizeString(param.mmtPrevious),
                },
              },
              denrStandard: {
                redFlag: sanitizeString(param.eqplRedFlag),
                action: sanitizeString(param.action),
                limit_mgL: parseFirstNumber(param.limit),
              },
              remark: sanitizeString(param.remarks),
            });
          }
        });
      }

      if (portParams.length > 0 || portDescription) {
        result.port = {
          locationDescription: portDescription || "Port",
          parameters: portParams,
          samplingDate: sanitizeString(portSource.dateTime),
          weatherAndWind: sanitizeString(portSource.weatherWind),
          explanationForConfirmatorySampling: sanitizeString(
            portSource.isExplanationNA ? "N/A" : portSource.explanation
          ),
          overallAssessment: sanitizeString(portSource.overallCompliance),
        };
      }
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  const hasLocationStructure =
    raw.quarryData ||
    raw.plantData ||
    raw.quarryPlantData ||
    (Array.isArray(raw.ports) && raw.ports.some((port) => port));

  if (hasLocationStructure) {
    const orFallback = (value, fallback) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }
      return value;
    };

    const mapLocationParam = (param, fallback) => {
      const resolvedParameter = sanitizeString(
        orFallback(param?.parameter, fallback?.parameter)
      );
      if (!resolvedParameter.trim()) {
        return null;
      }
      const resolvedResultType = sanitizeString(
        orFallback(param?.resultType, fallback?.resultType)
      );
      const currentTss = sanitizeString(
        orFallback(param?.tssCurrent, fallback?.tssCurrent)
      );
      const previousTss = sanitizeString(
        orFallback(param?.tssPrevious, fallback?.tssPrevious)
      );
      return {
        name: resolvedParameter,
        result: {
          internalMonitoring: {
            month: resolvedResultType,
            readings: [
              {
                label: resolvedParameter,
                current_mgL: parseFirstNumber(currentTss),
                previous_mgL: parseFirstNumber(previousTss),
              },
            ],
          },
          mmtConfirmatorySampling: {
            current: sanitizeString(
              orFallback(param?.mmtCurrent, fallback?.mmtCurrent)
            ),
            previous: sanitizeString(
              orFallback(param?.mmtPrevious, fallback?.mmtPrevious)
            ),
          },
        },
        denrStandard: {
          redFlag: sanitizeString(
            orFallback(param?.eqplRedFlag, fallback?.eqplRedFlag)
          ),
          action: sanitizeString(orFallback(param?.action, fallback?.action)),
          limit_mgL: parseFirstNumber(
            sanitizeString(orFallback(param?.limit, fallback?.limit))
          ),
        },
        remark: sanitizeString(orFallback(param?.remarks, fallback?.remarks)),
      };
    };

    const mapLocationData = (locationData) => {
      if (!locationData || typeof locationData !== "object") {
        return null;
      }
      const mainParam = mapLocationParam(locationData, locationData);
      const extraParams = Array.isArray(locationData.parameters)
        ? locationData.parameters
            .map((param) => mapLocationParam(param, locationData))
            .filter((param) => !!param)
        : [];
      const parameters = [...(mainParam ? [mainParam] : []), ...extraParams];
      if (!parameters.length) {
        return null;
      }
      return {
        locationDescription: sanitizeString(locationData.locationInput),
        parameters,
        samplingDate: sanitizeString(locationData.dateTime),
        weatherAndWind: sanitizeString(locationData.weatherWind),
        explanationForConfirmatorySampling: sanitizeString(
          locationData.isExplanationNA ? "N/A" : locationData.explanation
        ),
        overallAssessment: sanitizeString(locationData.overallCompliance),
      };
    };

    const mapPortData = (portData) => {
      if (!portData || typeof portData !== "object") {
        return null;
      }
      const mainParam = mapLocationParam(portData, portData);
      const extraParams = Array.isArray(portData.additionalParameters)
        ? portData.additionalParameters
            .map((param) => mapLocationParam(param, portData))
            .filter((param) => !!param)
        : [];
      const parameters = [...(mainParam ? [mainParam] : []), ...extraParams];
      if (!parameters.length) {
        return null;
      }
      return {
        locationDescription: sanitizeString(
          portData.portName ?? portData.locationInput
        ),
        parameters,
        samplingDate: sanitizeString(portData.dateTime),
        weatherAndWind: sanitizeString(portData.weatherWind),
        explanationForConfirmatorySampling: sanitizeString(
          portData.isExplanationNA ? "N/A" : portData.explanation
        ),
        overallAssessment: sanitizeString(
          portData.overallCompliance ?? raw?.data?.overallCompliance
        ),
      };
    };

    const result = {};
    if (raw.quarryData) {
      const quarry = mapLocationData(raw.quarryData);
      if (quarry) {
        result.quarry = quarry;
      }
    }
    if (raw.plantData) {
      const plant = mapLocationData(raw.plantData);
      if (plant) {
        result.plant = plant;
      }
    }
    if (raw.quarryPlantData) {
      const quarryPlant = mapLocationData(raw.quarryPlantData);
      if (quarryPlant) {
        result.quarryAndPlant = quarryPlant;
      }
    }
    if (Array.isArray(raw.ports) && raw.ports.length) {
      raw.ports.forEach((portData) => {
        const port = mapPortData(portData);
        if (port) {
          result.port = port;
        }
      });
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  const sel = raw.selectedLocations || {};
  const d = raw.data || {};
  const params = Array.isArray(raw.parameters) ? raw.parameters : [];
  const ports = Array.isArray(raw.ports) ? raw.ports : [];

  const makeParam = (p) => ({
    name: String(p?.parameter ?? ""),
    result: {
      internalMonitoring: {
        month: String(p?.resultType ?? d?.resultType ?? ""),
        readings: [
          {
            label: String(p?.parameter ?? "Reading"),
            current_mgL: parseFirstNumber(p?.tssCurrent ?? d?.tssCurrent),
            previous_mgL: parseFirstNumber(p?.tssPrevious ?? d?.tssPrevious),
          },
        ],
      },
      mmtConfirmatorySampling: {
        current: String(p?.mmtCurrent ?? d?.mmtCurrent ?? ""),
        previous: String(p?.mmtPrevious ?? d?.mmtPrevious ?? ""),
      },
    },
    denrStandard: {
      redFlag: String(p?.eqplRedFlag ?? d?.eqplRedFlag ?? ""),
      action: String(p?.action ?? d?.action ?? ""),
      limit_mgL: parseFirstNumber(p?.limit ?? d?.limit),
    },
    remark: String(p?.remarks ?? d?.remarks ?? ""),
  });

  const result = {};

  if (sel.quarry && d?.quarryInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((param) => makeParam(param));
    result.quarry = {
      locationDescription: String(d?.quarryInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p?.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  if (sel.plant && d?.plantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((param) => makeParam(param));
    result.plant = {
      locationDescription: String(d?.plantInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p?.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  if (sel.quarryPlant && d?.quarryPlantInput) {
    const mainParam = makeParam(d);
    const extraParams = params.map((param) => makeParam(param));
    result.quarryAndPlant = {
      locationDescription: String(d?.quarryPlantInput ?? ""),
      parameters: [mainParam, ...extraParams].filter((p) => p?.name),
      samplingDate: String(d?.dateTime ?? ""),
      weatherAndWind: String(d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(d?.explanation ?? ""),
      overallAssessment: String(d?.overallCompliance ?? ""),
    };
  }

  // ✅ FIX: Handle portEnabled with port (string) and portData (object)
  if (raw.portEnabled && (typeof raw.port === 'string' || raw.portData)) {
    // Use portData if available, otherwise fall back to shared data
    const portSource = raw.portData || d;
    const portDescription = typeof raw.port === 'string'
      ? raw.port
      : (raw.portInput ||
          (portSource?.portName ??
            portSource?.locationInput ??
            d?.port ??
            ""));
    
    const portMainParam = makeParam(portSource);
    const portExtraParams = Array.isArray(portSource?.parameters)
      ? portSource.parameters.map(makeParam)
      : [];

    result.port = {
      locationDescription: String(portDescription),
      parameters: [portMainParam, ...portExtraParams]
        .filter((param) => param?.name)
        .map((param) => ({
          ...param,
          result: {
            ...param.result,
            internalMonitoring: {
              ...param.result.internalMonitoring,
              readings: param.result.internalMonitoring.readings.map(
                (reading) => ({
                  ...reading,
                  current_mgL: parseFirstNumber(reading.current_mgL),
                  previous_mgL: parseFirstNumber(reading.previous_mgL),
                })
              ),
            },
          },
        })),
      samplingDate: String(portSource?.dateTime ?? d?.dateTime ?? ""),
      weatherAndWind: String(portSource?.weatherWind ?? d?.weatherWind ?? ""),
      explanationForConfirmatorySampling: String(
        portSource?.explanation ?? d?.explanation ?? ""
      ),
      overallAssessment: String(
        portSource?.overallCompliance ?? d?.overallCompliance ?? ""
      ),
    };
  }

  // Legacy ports array handling
  if (ports?.length) {
    ports.forEach((port) => {
      const portMainParam = makeParam(port);
      const portExtraParams = Array.isArray(port.additionalParameters)
        ? port.additionalParameters.map((param) => makeParam(param))
        : [];

      result.port = {
        locationDescription: String(
          port?.portName ?? port?.locationInput ?? d?.port ?? ""
        ),
        parameters: [portMainParam, ...portExtraParams]
          .filter((param) => param?.name)
          .map((param) => ({
            ...param,
            result: {
              ...param.result,
              internalMonitoring: {
                ...param.result.internalMonitoring,
                readings: param.result.internalMonitoring.readings.map(
                  (reading) => ({
                    ...reading,
                    current_mgL: parseFirstNumber(reading.current_mgL),
                    previous_mgL: parseFirstNumber(reading.previous_mgL),
                  })
                ),
              },
            },
          })),
        samplingDate: String(port?.dateTime ?? d?.dateTime ?? ""),
        weatherAndWind: String(port?.weatherWind ?? d?.weatherWind ?? ""),
        explanationForConfirmatorySampling: String(
          port?.explanation ?? d?.explanation ?? ""
        ),
        overallAssessment: String(
          port?.overallCompliance ?? d?.overallCompliance ?? ""
        ),
      };
    });
  }

  return Object.keys(result).length ? result : undefined;
};

const buildNoiseQualityImpactAssessment = (raw) => {
  if (!raw) return undefined;
  const list = Array.isArray(raw.parameters) ? raw.parameters : [];
  const parameters = list
    .map((p) => ({
      name: String(p?.parameter ?? ""),
      results: {
        inSMR: {
          current: String(p?.currentInSMR ?? ""),
          previous: String(p?.previousInSMR ?? ""),
        },
        mmtConfirmatorySampling: {
          current: String(p?.mmtCurrent ?? ""),
          previous: String(p?.mmtPrevious ?? ""),
        },
      },
      eqpl: {
        redFlag: String(p?.redFlag ?? ""),
        action: String(p?.action ?? ""),
        denrStandard: String(p?.limit ?? ""),
      },
      remarks: String(p?.remarks ?? ""),
    }))
    .filter((p) => p.name);

  const toQuarter = (content) =>
    content
      ? {
          assessment: String(content),
        }
      : undefined;

  const overallAssessment = {};
  if (raw?.quarters?.first)
    overallAssessment.firstQuarter = toQuarter(raw.quarters.first);
  if (raw?.quarters?.second)
    overallAssessment.secondQuarter = toQuarter(raw.quarters.second);
  if (raw?.quarters?.third)
    overallAssessment.thirdQuarter = toQuarter(raw.quarters.third);
  if (raw?.quarters?.fourth)
    overallAssessment.fourthQuarter = toQuarter(raw.quarters.fourth);

  const uploadedFiles = (
    Array.isArray(raw?.uploadedFiles) ? raw.uploadedFiles : []
  )
    .map((file) => {
      const storagePath =
        typeof file?.storagePath === "string"
          ? file.storagePath.trim()
          : undefined;
      const uri = typeof file?.uri === "string" ? file.uri.trim() : undefined;
      if (!storagePath && !uri) return null;

      const name =
        typeof file?.name === "string" && file.name.trim()
          ? file.name.trim()
          : storagePath?.split("/").pop();

      const size =
        typeof file?.size === "number"
          ? file.size
          : Number.isFinite(Number(file?.size))
            ? Number(file.size)
            : undefined;

      const mimeType =
        typeof file?.mimeType === "string" && file.mimeType.trim()
          ? file.mimeType.trim()
          : undefined;

      return { uri, name, size, mimeType, storagePath };
    })
    .filter(Boolean);

  return {
    parameters: parameters.length ? parameters : undefined,
    samplingDate: String(raw?.dateTime ?? ""),
    weatherAndWind: String(raw?.weatherWind ?? ""),
    explanationForConfirmatorySampling: String(raw?.explanation ?? ""),
    overallAssessment: Object.keys(overallAssessment).length
      ? overallAssessment
      : undefined,
    uploadedFiles: uploadedFiles.length ? uploadedFiles : undefined,
  };
};

const buildWasteManagementSection = (raw) => {
  if (!raw) return undefined;
  const mapPlantPortSection = (sec) => {
    if (!sec) return [];
    const items = Array.isArray(sec?.eccEpepCommitments)
      ? sec.eccEpepCommitments
      : [];
    return items.map((it) => ({
      typeOfWaste: String(sec?.typeOfWaste ?? ""),
      eccEpepCommitments: {
        handling: String(it?.handling ?? ""),
        storage: String(it?.storage ?? ""),
        disposal: Boolean(it?.disposal),
      },
      adequate: {
        y: String(sec?.isAdequate ?? "").toUpperCase() === "YES",
        n: String(sec?.isAdequate ?? "").toUpperCase() === "NO",
      },
      previousRecord: sec?.previousRecord ?? "",
      q2_2025_Generated_HW: sec?.currentQuarterWaste ?? "",
      total: undefined,
    }));
  };
  const quarry = raw?.quarryData?.N_A
    ? "N/A"
    : raw?.quarryData?.noSignificantImpact && !raw?.quarryData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.quarryPlantData);
  const plant = raw?.plantSimpleData?.N_A
    ? "N/A"
    : raw?.plantSimpleData?.noSignificantImpact &&
        !raw?.plantSimpleData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.plantData);
  const port = raw?.portData?.N_A
    ? "N/A"
    : raw?.portData?.noSignificantImpact && !raw?.portData?.generateTable
      ? "No significant impact"
      : mapPlantPortSection(raw?.portPlantData);
  return { quarry, plant, port };
};

const buildChemicalSafetySection = (raw) => {
  if (!raw) return undefined;
  const cs = raw.chemicalSafety || {};
  const yn = (v) => String(v).toUpperCase() === "YES";
  return {
    chemicalSafety: {
      isNA: cs.isNA ?? undefined,
      riskManagement:
        cs.riskManagement != null ? yn(cs.riskManagement) : undefined,
      training: cs.training != null ? yn(cs.training) : undefined,
      handling: cs.handling != null ? yn(cs.handling) : undefined,
      emergencyPreparedness:
        cs.emergencyPreparedness != null
          ? yn(cs.emergencyPreparedness)
          : undefined,
      remarks: cs.remarks ?? undefined,
      chemicalCategory: cs.chemicalCategory ?? undefined,
      othersSpecify: cs.othersSpecify ?? undefined,
    },
    healthSafetyChecked: !!raw.healthSafetyChecked,
    socialDevChecked: !!raw.socialDevChecked,
  };
};

const buildComplaintsList = (raw) => {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw
    .map((c) => ({
      dateFiled: sanitizeString(c?.dateFiled),
      filedLocation: sanitizeString(c?.filedLocation),
      othersSpecify:
        c?.filedLocation === "Others"
          ? sanitizeString(c?.othersSpecify)
          : undefined,
      nature: sanitizeString(c?.nature),
      resolutions: sanitizeString(c?.resolutions),
      id: c?.id ?? undefined,
      isNA: typeof c?.isNA === "boolean" ? c.isNA : undefined,
    }))
    .filter(
      (entry) =>
        entry.isNA ||
        entry.dateFiled ||
        entry.filedLocation ||
        entry.nature ||
        entry.resolutions
    );
  return cleaned.length ? cleaned : undefined;
};

const hasPrimaryPermitData = (fields = []) =>
  fields.some((value) => sanitizeString(value).length > 0);

const buildEccEntries = (info = {}, additional = []) => {
  const entries = [];

  if (
    !info.isNA &&
    hasPrimaryPermitData([
      info.permitHolder,
      info.eccNumber,
      info.dateOfIssuance,
    ])
  ) {
    entries.push({
      permitHolderName: sanitizeString(info.permitHolder),
      eccNumber: sanitizeString(info.eccNumber),
      dateOfIssuance: sanitizeString(info.dateOfIssuance),
    });
  }

  (Array.isArray(additional) ? additional : []).forEach((form) => {
    if (
      hasPrimaryPermitData([
        form?.permitHolder,
        form?.eccNumber,
        form?.dateOfIssuance,
      ])
    ) {
      entries.push({
        permitHolderName: sanitizeString(form?.permitHolder),
        eccNumber: sanitizeString(form?.eccNumber),
        dateOfIssuance: sanitizeString(form?.dateOfIssuance),
      });
    }
  });

  return entries;
};

const buildIsagEntries = (info = {}, additional = []) => {
  const entries = [];

  if (
    !info.isNA &&
    hasPrimaryPermitData([
      info.permitHolder,
      info.isagNumber,
      info.dateOfIssuance,
    ])
  ) {
    entries.push({
      permitHolderName: sanitizeString(info.permitHolder),
      isagPermitNumber: sanitizeString(info.isagNumber),
      dateOfIssuance: sanitizeString(info.dateOfIssuance),
    });
  }

  (Array.isArray(additional) ? additional : []).forEach((form) => {
    if (
      hasPrimaryPermitData([
        form?.permitHolder,
        form?.isagNumber,
        form?.dateOfIssuance,
      ])
    ) {
      entries.push({
        permitHolderName: sanitizeString(form?.permitHolder),
        isagPermitNumber: sanitizeString(form?.isagNumber),
        dateOfIssuance: sanitizeString(form?.dateOfIssuance),
      });
    }
  });

  return entries;
};

const buildEpepEntries = (info = {}, additional = []) => {
  const entries = [];

  if (
    !info.isNA &&
    hasPrimaryPermitData([
      info.permitHolder,
      info.epepNumber,
      info.dateOfApproval,
    ])
  ) {
    entries.push({
      permitHolderName: sanitizeString(info.permitHolder),
      epepNumber: sanitizeString(info.epepNumber),
      dateOfApproval: sanitizeString(info.dateOfApproval),
    });
  }

  (Array.isArray(additional) ? additional : []).forEach((form) => {
    if (
      hasPrimaryPermitData([
        form?.permitHolder,
        form?.epepNumber,
        form?.dateOfApproval,
      ])
    ) {
      entries.push({
        permitHolderName: sanitizeString(form?.permitHolder),
        epepNumber: sanitizeString(form?.epepNumber),
        dateOfApproval: sanitizeString(form?.dateOfApproval),
      });
    }
  });

  return entries;
};

const buildFundEntries = (info = {}, additional = []) => {
  const entries = [];

  if (
    !info.isNA &&
    hasPrimaryPermitData([
      info.permitHolder,
      info.savingsAccount,
      info.amountDeposited,
      info.dateUpdated,
    ])
  ) {
    entries.push({
      permitHolderName: sanitizeString(info.permitHolder),
      savingsAccountNumber: sanitizeString(info.savingsAccount),
      amountDeposited: sanitizeString(info.amountDeposited),
      dateUpdated: sanitizeString(info.dateUpdated),
    });
  }

  (Array.isArray(additional) ? additional : []).forEach((form) => {
    if (
      hasPrimaryPermitData([
        form?.permitHolder,
        form?.savingsAccount,
        form?.amountDeposited,
        form?.dateUpdated,
      ])
    ) {
      entries.push({
        permitHolderName: sanitizeString(form?.permitHolder),
        savingsAccountNumber: sanitizeString(form?.savingsAccount),
        amountDeposited: sanitizeString(form?.amountDeposited),
        dateUpdated: sanitizeString(form?.dateUpdated),
      });
    }
  });

  return entries;
};

const buildCoordinatesString = (info = {}) => {
  const gpsX = sanitizeString(info.gpsX);
  const gpsY = sanitizeString(info.gpsY);
  if (!gpsX && !gpsY) return "";
  if (gpsX && gpsY) return `X: ${gpsX}, Y: ${gpsY}`;
  return gpsX ? `X: ${gpsX}` : `Y: ${gpsY}`;
};

/**
 * Main transformation function: Store data → Backend DTO
 * Maps the store structure to the exact backend CreateCMVRDto structure
 */
export const transformToBackendDTO = (
  currentReport,
  generalInfo,
  createdById
) => {
  if (!currentReport) return null;

  const safeGeneralInfo = generalInfo || {};
  const proponentInfo = safeGeneralInfo.proponent || {};
  const isagInfo = currentReport.isagInfo || {};
  const mmtInfo = {
    ...(safeGeneralInfo.mmt || safeGeneralInfo.environmentalOfficer || {}),
    ...(currentReport.mmtInfo || {}),
  };
  const recommendationsData = currentReport.recommendationsData || {};
  const airQualityAssessment =
    buildAirQualityImpactAssessment(currentReport.airQualityImpactAssessment) ||
    {};
  const waterQualityAssessment =
    buildWaterQualityImpactAssessment(
      currentReport.waterQualityImpactAssessment
    ) || {};
  const noiseQualityAssessment = buildNoiseQualityImpactAssessment(
    currentReport.noiseQualityImpactAssessment
  );
  const wasteManagementSection = buildWasteManagementSection(
    currentReport.complianceWithGoodPracticeInSolidAndHazardousWasteManagement
  );
  const chemicalSafetySection = buildChemicalSafetySection(
    currentReport.complianceWithGoodPracticeInChemicalSafetyManagement
  );
  const complaintsList = buildComplaintsList(
    currentReport.complaintsVerificationAndManagement
  );
  const projectLocationSection = buildProjectLocationSection(
    currentReport.complianceToProjectLocationAndCoverageLimits
  );
  const impactCommitmentsSection = buildImpactManagementSection(
    currentReport.complianceToImpactManagementCommitments
  );
  const recommendationFromPrevQuarter = buildRecommendationsSection(
    recommendationsData.previousRecommendations,
    recommendationsData.prevQuarter,
    recommendationsData.prevYear
  );
  const recommendationForNextQuarter = buildRecommendationsSection(
    recommendationsData.currentRecommendations,
    safeGeneralInfo.quarter,
    safeGeneralInfo.year
  );

  const eccEntries = buildEccEntries(
    currentReport.eccInfo || {},
    currentReport.eccAdditionalForms || []
  );
  const isagEntries = buildIsagEntries(
    currentReport.isagInfo || {},
    currentReport.isagAdditionalForms || []
  );
  const epepEntries = buildEpepEntries(
    currentReport.epepInfo || {},
    currentReport.epepAdditionalForms || []
  );
  const rcfEntries = buildFundEntries(
    currentReport.rcfInfo || {},
    currentReport.rcfAdditionalForms || []
  );
  const mtfEntries = buildFundEntries(
    currentReport.mtfInfo || {},
    currentReport.mtfAdditionalForms || []
  );
  const fmrdfEntries = buildFundEntries(
    currentReport.fmrdfInfo || {},
    currentReport.fmrdfAdditionalForms || []
  );

  const fallbackProjectName =
    safeGeneralInfo.projectName || safeGeneralInfo.companyName || "";
  const projectCurrentName =
    safeGeneralInfo.projectCurrentName ||
    safeGeneralInfo.projectNameCurrent ||
    isagInfo.currentName ||
    fallbackProjectName;
  const projectNameInEcc =
    isagInfo.nameInECC ||
    safeGeneralInfo.projectNameInEcc ||
    fallbackProjectName;
  const projectStatus =
    safeGeneralInfo.projectStatus || isagInfo.projectStatus || "";
  const projectCoordinates =
    safeGeneralInfo.projectGeographicalCoordinates ||
    buildCoordinatesString(isagInfo);

  const dateOfComplianceMonitoringAndValidation =
    safeGeneralInfo.dateOfComplianceMonitoringAndValidation ||
    safeGeneralInfo.dateOfCompliance ||
    "";

  const monitoringPeriodCovered =
    safeGeneralInfo.monitoringPeriodCovered ||
    safeGeneralInfo.monitoringPeriod ||
    "";

  const dateOfCmrSubmission =
    safeGeneralInfo.dateOfCmrSubmission ||
    safeGeneralInfo.dateOfCMRSubmission ||
    safeGeneralInfo.submissionDate ||
    "";

  const resolveContact = (value, fallback) =>
    sanitizeString(value) || sanitizeString(fallback);

  const proponentContact =
    resolveContact(
      proponentInfo.contactPersonAndPosition,
      proponentInfo.contactPerson
    ) ||
    sanitizeString(isagInfo.proponentContact) ||
    sanitizeString(isagInfo.proponentName) ||
    "";
  const proponentMailing =
    proponentInfo.mailingAddress || isagInfo.proponentAddress || "";
  const proponentTelephone =
    proponentInfo.telephoneFax ||
    proponentInfo.phoneNumber ||
    proponentInfo.phone ||
    isagInfo.proponentPhone ||
    "";
  const proponentEmail =
    proponentInfo.emailAddress ||
    proponentInfo.email ||
    isagInfo.proponentEmail ||
    "";

  const epepFmrdpStatus =
    safeGeneralInfo.epepFmrdpStatus ||
    (currentReport.epepInfo?.isNA ? "N/A" : "Approved");

  const permitHolderList = Array.isArray(currentReport.permitHolderList)
    ? currentReport.permitHolderList.filter((holder) => sanitizeString(holder))
    : undefined;

  return {
    createdById: createdById || undefined,
    // Basic project information (from generalInfo)
    companyName: safeGeneralInfo.companyName || "",
    permitHolderList,
    location: safeGeneralInfo.location || "",
    quarter: safeGeneralInfo.quarter || "",
    year: parseInt(safeGeneralInfo.year) || new Date().getFullYear(),
    dateOfComplianceMonitoringAndValidation,
    monitoringPeriodCovered,
    dateOfCmrSubmission,

    // Project details
    projectCurrentName,
    projectNameInEcc,
    projectStatus,
    projectGeographicalCoordinates: projectCoordinates,

    // Contact information (must have all required string fields)
    // Map from store keys to backend DTO keys
    proponent: {
      contactPersonAndPosition: proponentContact,
      mailingAddress: proponentMailing,
      telephoneFax: proponentTelephone,
      emailAddress: proponentEmail,
    },
    mmt: {
      contactPersonAndPosition:
        mmtInfo.contactPersonAndPosition || mmtInfo.contactPerson || "",
      mailingAddress: mmtInfo.mailingAddress || "",
      telephoneFax:
        mmtInfo.telephoneFax || mmtInfo.phoneNumber || mmtInfo.phone || "",
      emailAddress: mmtInfo.emailAddress || mmtInfo.email || "",
    },

    // EPEP/FMRDP status
    epepFmrdpStatus,

    // Permit arrays (extract from store nested objects)
    ecc: eccEntries,
    isagMpp: isagEntries,
    epep: epepEntries,
    rehabilitationCashFund: rcfEntries,
    monitoringTrustFundUnified: mtfEntries,
    finalMineRehabilitationAndDecommissioningFund: fmrdfEntries,

    // Executive Summary (transform structure)
    executiveSummaryOfCompliance: transformExecutiveSummary(
      currentReport.executiveSummaryOfCompliance
    ),

    // Process Documentation (transform structure)
    processDocumentationOfActivitiesUndertaken: transformProcessDocumentation(
      currentReport.processDocumentationOfActivitiesUndertaken
    ),

    // Compliance Monitoring Report - wraps ALL assessments
    complianceMonitoringReport: {
      complianceToProjectLocationAndCoverageLimits: projectLocationSection,

      complianceToImpactManagementCommitments: impactCommitmentsSection,

      airQualityImpactAssessment: airQualityAssessment,

      waterQualityImpactAssessment: waterQualityAssessment,

      noiseQualityImpactAssessment: noiseQualityAssessment || undefined,

      complianceWithGoodPracticeInSolidAndHazardousWasteManagement:
        wasteManagementSection || undefined,

      complianceWithGoodPracticeInChemicalSafetyManagement:
        chemicalSafetySection || undefined,

      complaintsVerificationAndManagement: complaintsList || undefined,

      // Transform recommendations structure
      recommendationFromPrevQuarter: recommendationFromPrevQuarter || undefined,

      recommendationForNextQuarter: recommendationForNextQuarter || undefined,
    },

    // Optional fields
    attendanceId: currentReport.attendanceId || undefined,
    attachments: currentReport.attachments || undefined,
    eccConditionsAttachment: currentReport.eccConditionsAttachment || undefined,
  };
};
