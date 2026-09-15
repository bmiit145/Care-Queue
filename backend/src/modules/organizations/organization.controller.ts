33import { Request, Response } from 'express';
import { Organization } from './organization.model';

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, contactEmail, contactPhone, address } = req.body;
    
    const newOrganization = new Organization({
      name,
      type,
      contactEmail,
      contactPhone,
      address,
    });

    const savedOrganization = await newOrganization.save();
    res.status(201).json(savedOrganization);
  } catch (error) {
    res.status(500).json({ message: 'Error creating organization', error });
  }
};

export const getOrganizations = async (req: Request, res: Response): Promise<void> => {
  try {
    const organizations = await Organization.find({ isActive: true });
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizations', error });
  }
};
