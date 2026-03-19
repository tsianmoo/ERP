package com.productmanagement.service.impl;

import com.productmanagement.dto.SizeValueDTO;
import com.productmanagement.entity.SizeValue;
import com.productmanagement.repository.SizeValueRepository;
import com.productmanagement.service.SizeValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SizeValueServiceImpl implements SizeValueService {
    
    private final SizeValueRepository repository;
    
    @Override
    public List<SizeValueDTO> getAllValues() {
        return repository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<SizeValueDTO> getValuesByGroupId(Integer groupId) {
        return repository.findByGroupIdOrderBySortOrderAsc(groupId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    @Override
    public SizeValueDTO getValueById(Integer id) {
        SizeValue value = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("尺码值不存在: " + id));
        return toDTO(value);
    }
    
    @Override
    @Transactional
    public SizeValueDTO createValue(SizeValueDTO request) {
        SizeValue value = new SizeValue();
        value.setGroupId(request.getGroupId());
        value.setName(request.getName());
        value.setCode(request.getCode());
        value.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        
        SizeValue saved = repository.save(value);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public SizeValueDTO updateValue(Integer id, SizeValueDTO request) {
        SizeValue value = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("尺码值不存在: " + id));
        
        if (request.getName() != null) value.setName(request.getName());
        if (request.getCode() != null) value.setCode(request.getCode());
        if (request.getSortOrder() != null) value.setSortOrder(request.getSortOrder());
        
        SizeValue saved = repository.save(value);
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public void deleteValue(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("尺码值不存在: " + id);
        }
        repository.deleteById(id);
    }
    
    @Override
    @Transactional
    public void deleteValuesByGroupId(Integer groupId) {
        repository.deleteByGroupId(groupId);
    }
    
    private SizeValueDTO toDTO(SizeValue value) {
        SizeValueDTO dto = new SizeValueDTO();
        dto.setId(value.getId());
        dto.setGroupId(value.getGroupId());
        dto.setName(value.getName());
        dto.setCode(value.getCode());
        dto.setSortOrder(value.getSortOrder());
        dto.setCreatedAt(value.getCreatedAt());
        dto.setUpdatedAt(value.getUpdatedAt());
        return dto;
    }
}
