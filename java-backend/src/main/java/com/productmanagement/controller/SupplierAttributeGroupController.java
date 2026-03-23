package com.productmanagement.controller;

import com.productmanagement.dto.SupplierAttributeGroupDTO;
import com.productmanagement.service.SupplierAttributeGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-attr-groups")
@RequiredArgsConstructor
public class SupplierAttributeGroupController {
    
    private final SupplierAttributeGroupService groupService;
    
    @GetMapping
    public ResponseEntity<List<SupplierAttributeGroupDTO>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierAttributeGroupDTO> getGroupById(@PathVariable Integer id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }
    
    @PostMapping
    public ResponseEntity<SupplierAttributeGroupDTO> createGroup(@RequestBody SupplierAttributeGroupDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierAttributeGroupDTO> updateGroup(@PathVariable Integer id, @RequestBody SupplierAttributeGroupDTO request) {
        return ResponseEntity.ok(groupService.updateGroup(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Integer id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
