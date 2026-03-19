package com.productmanagement.service;

import com.productmanagement.dto.ColorValueDTO;
import java.util.List;

public interface ColorValueService {
    
    List<ColorValueDTO> getAllValues();
    
    List<ColorValueDTO> getValuesByGroupId(Integer groupId);
    
    ColorValueDTO getValueById(Integer id);
    
    ColorValueDTO createValue(ColorValueDTO request);
    
    ColorValueDTO updateValue(Integer id, ColorValueDTO request);
    
    void deleteValue(Integer id);
    
    void deleteValuesByGroupId(Integer groupId);
}
