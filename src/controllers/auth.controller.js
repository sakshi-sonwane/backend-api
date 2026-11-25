import {
  revokeSession,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  sessionsList,
  createProject,
  projectList,
  getProjectById,
  updateProjectById,
  deleteProjectById,
  addMemberstoProject,
  listProjMembers,
} from "../modules/auth/auth.service.js";

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const currentUser = async (req, res, next) => {
  try {
    res.status(200).json({ data: req.user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // refreshToken mtlb plainToken
    await logoutUser(req.body.refreshToken);
    res.status(200).json({ message: "logged out" });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

export const sessions = async (req, res, next) => {
  try {
    const sessList = await sessionsList(req.user.id);
    res.status(200).json({ data: sessList });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    await revokeSession(req.user.id, req.params.id);
    res.status(200).json({ message: "session revoked successfully" });
  } catch (error) {
    next(error);
  }
};

export const createProjectController = async (req, res, next) => {
  try {
    const project = await createProject(req.user.id, req.body);
    res.status(201).json({
      data: {
        id: project.projectId,
        projectName: project.projectName,
        projectDescription: project.projectDescription,
        ownerId: project.ownerId,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const controllerProjectList = async (req, res, next) => {
  try {
    const projList = await projectList(req.user.id, req.validatedQuery);
    res.status(200).json({
      data: projList.data.map((p) => ({
        id: p.projectId,
        name: p.projectName,
        description: p.projectDescription,
        ownerId: p.ownerId,
        myRole: p.myRole,
        createdAt: p.createdAt,
      })),
      pagination: projList.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const findProjectById = async (req, res, next) => {
  try {
    const p = await getProjectById(req.user.id, req.params.projectId);
    res.status(200).json({
      data: {
        id: p.projectId,
        name: p.projectName,
        description: p.projectDescription,
        ownerId: p.ownerId,
        myRole: p.myRole,
        createdAt: p.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjById = async (req, res, next) => {
  try {
    const project = await updateProjectById(
      req.params.projectId,
      req.user.id,
      req.body,
    );
    res.status(200).json({
      data: {
        id: project._id,
        name: project.projectName,
        description: project.projectDescription,
        ownerId: project.ownerId,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteprojById = async (req, res, next) => {
  try {
    await deleteProjectById(req.params.projectId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    const member = await addMemberstoProject(
      req.user.id,
      email,
      req.params.projectId,
    );

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const contollerListProjectMembers = async (req, res, next) => {
  try {
    const list = await listProjMembers(
      req.params.projectId,
      req.user.id,
      req.validatedQuery,
    );

      const { total, members } = list;

    res.status(200).json({
      data: members,
      meta: {
        page: req.validatedQuery.page,
        limit: req.validatedQuery.limit,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};
