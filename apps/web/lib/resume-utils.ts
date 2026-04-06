import { createId } from "@resumeforge/shared";

export function createWorkItem() {
  return {
    id: createId(),
    company: "",
    title: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: []
  };
}

export function createEducationItem() {
  return {
    id: createId(),
    institution: "",
    degree: "",
    startDate: "",
    endDate: ""
  };
}

export function createProjectItem() {
  return {
    id: createId(),
    name: "",
    description: "",
    link: "",
    technologies: [],
    bullets: []
  };
}

export function createCertificationItem() {
  return {
    id: createId(),
    name: "",
    issuer: "",
    date: "",
    link: ""
  };
}
