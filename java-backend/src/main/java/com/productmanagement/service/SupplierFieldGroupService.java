package com.productmanagement.service;

import com.productmanagement.dto.SupplierFieldGroupDTO;

import java.util.List;

public interface SupplierFieldGroupService {
    
    List<SupplierFieldGroupDTO> getAllGroups();
    
    SupplierFieldGroupDTO getGroupById(Integer id);
    
    SupplierFieldGroupDTO createGroup(SupplierFieldGroupDTO request);
    
    SupplierFieldGroupDTO updateGroup(Integer id, SupplierFieldGroupDTO request);
    
    void deleteGroup(Integer id);
}
