package com.productmanagement.service;

import com.productmanagement.dto.SizeValueDTO;
import java.util.List;

public interface SizeValueService {
    
    List<SizeValueDTO> getAllValues();
    
    List<SizeValueDTO> getValuesByGroupId(Integer groupId);
    
    SizeValueDTO getValueById(Integer id);
    
    SizeValueDTO createValue(SizeValueDTO request);
    
    SizeValueDTO updateValue(Integer id, SizeValueDTO request);
    
    void deleteValue(Integer id);
    
    void deleteValuesByGroupId(Integer groupId);
}
