package com.productmanagement.controller;

import com.productmanagement.dto.SupplierFieldGroupDTO;
import com.productmanagement.service.SupplierFieldGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-field-groups")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SupplierFieldGroupController {
    
    private final SupplierFieldGroupService groupService;
    
    @GetMapping
    public ResponseEntity<List<SupplierFieldGroupDTO>> getAllGroups() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierFieldGroupDTO> getGroupById(@PathVariable Integer id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }
    
    @PostMapping
    public ResponseEntity<SupplierFieldGroupDTO> createGroup(@RequestBody SupplierFieldGroupDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(request));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierFieldGroupDTO> updateGroup(@PathVariable Integer id, @RequestBody SupplierFieldGroupDTO request) {
        return ResponseEntity.ok(groupService.updateGroup(id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Integer id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }
}
