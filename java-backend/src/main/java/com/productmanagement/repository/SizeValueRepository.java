package com.productmanagement.repository;

import com.productmanagement.entity.SizeValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SizeValueRepository extends JpaRepository<SizeValue, Integer> {
    
    List<SizeValue> findByGroupIdOrderBySortOrderAsc(Integer groupId);
}
