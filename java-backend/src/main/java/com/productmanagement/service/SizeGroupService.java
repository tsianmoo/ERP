package com.productmanagement.service;

import com.productmanagement.dto.SizeGroupDTO;

import java.util.List;

public interface SizeGroupService {
    
    List<SizeGroupDTO> getAllGroups();
    
    SizeGroupDTO getGroupById(Integer id);
    
    SizeGroupDTO createGroup(SizeGroupDTO request);
    
    SizeGroupDTO updateGroup(Integer id, SizeGroupDTO request);
    
    void deleteGroup(Integer id);
    
    void reorderGroups(List<Integer> groupIds);
}
