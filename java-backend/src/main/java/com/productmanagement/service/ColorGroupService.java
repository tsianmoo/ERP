package com.productmanagement.service;

import com.productmanagement.dto.ColorGroupDTO;

import java.util.List;

public interface ColorGroupService {
    
    List<ColorGroupDTO> getAllGroups();
    
    ColorGroupDTO getGroupById(Integer id);
    
    ColorGroupDTO createGroup(ColorGroupDTO request);
    
    ColorGroupDTO updateGroup(Integer id, ColorGroupDTO request);
    
    void deleteGroup(Integer id);
    
    void reorderGroups(List<Integer> groupIds);
}
